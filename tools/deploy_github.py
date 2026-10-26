# -*- coding: utf-8 -*-
"""把本站部署到 GitHub Pages。

用法（在 personal-site 目录下）：

    set GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx      # Windows cmd
    $env:GH_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxx"   # PowerShell
    python tools/deploy_github.py physics-notes

做的事：
  1. 用 GitHub API 读取当前账号
  2. 创建公开仓库（已存在则复用）
  3. git push 到 main 分支（Token 只通过 http.extraHeader 传给 git，
     不写入 .git/config，也不落盘）
  4. 开启 GitHub Pages（source = main 分支根目录）
  5. 输出访问网址

Token 需要 classic PAT，勾选 repo（或 public_repo）权限。
"""

import base64
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = 'https://api.github.com'


def api(method, path, data=None):
    req = urllib.request.Request(API + path, method=method)
    req.add_header('Authorization', 'Bearer ' + TOKEN)
    req.add_header('Accept', 'application/vnd.github+json')
    req.add_header('User-Agent', 'deploy-github-pages')
    body = None
    if data is not None:
        body = json.dumps(data).encode('utf-8')
        req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, body, timeout=40) as r:
            raw = r.read().decode('utf-8')
            return r.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as e:
        raw = e.read().decode('utf-8')
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {'message': raw[:300]}


def git(args, env=None):
    cmd = ['git'] + args
    return subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True, env=env)


def proxy_args():
    p = os.environ.get('https_proxy') or os.environ.get('http_proxy') or ''
    return ['-c', 'http.proxy=' + p, '-c', 'https.proxy=' + p] if p else []


def main():
    global TOKEN
    TOKEN = os.environ.get('GH_TOKEN', '').strip()
    if not TOKEN:
        print('缺少环境变量 GH_TOKEN')
        print('  Windows PowerShell: $env:GH_TOKEN="ghp_xxx"')
        print('  Windows cmd       : set GH_TOKEN=ghp_xxx')
        return 1

    repo = sys.argv[1] if len(sys.argv) > 1 else 'physics-notes'

    # 1. 当前账号
    code, me = api('GET', '/user')
    if code != 200:
        print('读取账号失败:', code, me.get('message'))
        return 1
    owner = me.get('login')
    print('GitHub 账号:', owner)

    # 2. 建仓库
    code, res = api('POST', '/user/repos', {
        'name': repo, 'public': True, 'auto_init': False,
        'description': '高中物理讲义在线阅读（章 → 节）'
    })
    if code in (201,):
        print('仓库已创建:', res.get('html_url'))
    elif code == 422:
        print('仓库已存在，直接复用:', owner + '/' + repo)
    else:
        print('建仓库失败:', code, res.get('message'))
        return 1

    time.sleep(2)

    # 3. 推送
    git(['branch', '-M', 'main'])
    url = 'https://github.com/%s/%s.git' % (owner, repo)
    r = git(['remote', 'remove', 'origin'])
    r = git(['remote', 'add', 'origin', url])
    if r.returncode != 0:
        print('设置远程失败:', r.stderr)
        return 1

    env = dict(os.environ)
    env['GIT_TERMINAL_PROMPT'] = '0'
    # GitHub 的 git 端点只接受 Basic 认证（Bearer 会被判为 invalid credentials）
    basic = base64.b64encode(('%s:%s' % (owner, TOKEN)).encode()).decode()
    push = git(proxy_args() + [
        '-c', 'http.extraHeader=Authorization: Basic ' + basic,
        'push', '-u', 'origin', 'main'
    ], env=env)
    if push.returncode != 0:
        print('推送失败:', push.stderr.strip()[:400])
        return 1
    print('推送完成')

    # 4. 开启 Pages
    code, res = api('POST', '/repos/%s/%s/pages' % (owner, repo),
                    {'source': {'branch': 'main', 'path': '/'}})
    if code in (201, 204):
        print('GitHub Pages 已开启')
    elif code == 409:
        print('GitHub Pages 已开启过（409），继续')
    else:
        print('开启 Pages 失败:', code, res.get('message'))

    # 5. 网址
    site = 'https://%s.github.io/%s/' % (owner, repo)
    print('\n访问网址:', site)

    ok = False
    for i in range(20):
        time.sleep(10)
        try:
            req = urllib.request.Request(site, headers={'User-Agent': 'check'})
            with urllib.request.urlopen(req, timeout=20) as r:
                if r.status == 200:
                    print('已可访问（HTTP 200），等待 %ds 后生效' % (i * 10 + 10))
                    ok = True
                    break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                continue
            print('返回', e.code)
            break
        except Exception:
            continue
    if not ok:
        print('首次构建通常需要 1~3 分钟，请稍后刷新。若一直 404，'
              '请到仓库 Settings → Pages 确认 Source 为 main / root。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
