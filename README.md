# 讲义在线阅读站

按「章 → 节」组织讲义内容，访客可直接在浏览器里阅读正文、查看教材图片、翻阅配套 PDF。
纯静态站点：**没有构建步骤、没有依赖、没有外部 CDN**。

## 一、你的文件放在哪里

```
personal-site/
├─ content/
│  ├─ images/     ★ 教材图片放这里（.png / .jpg / .webp 均可）
│  └─ text/       ★ 讲义的 PDF / Word / PPT 放这里
├─ data/
│  └─ chapters.js ★ 章节目录与讲义正文（唯一需要编辑的配置）
└─ index.html
```

| 内容类型 | 放到哪里 | 然后在 chapters.js 里怎么写 |
|---|---|---|
| 教材图片 | `content/images/` | `images: [{ src: 'content/images/tu1-1.png', caption: '图1-1 …' }]` |
| 讲义 PDF / 文档 | `content/text/` | `docs: [{ path: 'content/text/xxx.pdf', title: '本节讲义' }]` |
| 讲义正文（文字） | 直接写在 `data/chapters.js` 的 `content` 里 | `content: \`…Markdown 正文…\`` |
| 讲义正文（很长 / 含反引号） | 存成 `content/text/xxx.md` | `contentFile: 'content/text/xxx.md'` |

> 图片与文档建议保持现有目录不变，只换文件：路径写对了就能显示，不需要改代码。
> 文件名可以用中文，但为避免部署到某些平台时出问题，**建议用英文或拼音**。

## 二、新增一章 / 一节

打开 `data/chapters.js`，在 `chapters` 数组里加一块：

```js
{
  id: 'ch03',                       // 章 id，随便起，不重复即可
  title: '第三章 交变电流',
  note: '章说明，可省略',
  sections: [
    {
      id: 'ch03-1',                 // 节 id，会变成网址 #/s/ch03-1
      title: '第1节 交变电流的产生',
      summary: '一句话摘要，显示在标题下方',
      content: `
## 一、交变电流

正文写在模板字符串里，支持 Markdown。

- 列表项
- 列表项

    E = nBSω sinωt

> 引用/提醒
`,
      images: [
        { src: 'content/images/tu3-1.png', caption: '图3-1 交流发电机示意图' }
      ],
      docs: [
        { path: 'content/text/ch03-1.pdf', title: '本节讲义 PDF' }
      ]
    }
  ]
}
```

字段都可以省略：没有图片就写 `images: []` 或直接删掉这一行，没有附件同理。

### 正文支持的 Markdown

| 写法 | 效果 |
|---|---|
| `# ` / `## ` / `### ` | 一 / 二 / 三级标题（正文里从 h2 起算，页面 h1 留给节标题） |
| `- ` 或 `* ` | 无序列表 |
| `1. ` | 有序列表 |
| `> ` | 引用 |
| 行首缩进 4 个空格 | 代码块 |
| `---` | 分隔线 |
| `**文字**` / `*文字*` / `[文字](链接)` | 粗体 / 斜体 / 链接 |

**注意**：正文写在模板字符串 `` ` … ` `` 里，所以**正文内部不能出现反引号**。
需要代码块请用行首缩进 4 个空格。如果正文里必须有反引号，改用 `contentFile`
引用独立的 `.md` 文件（此时站点需要用 http 方式访问，不能双击打开）。

## 三、运行

```bash
cd personal-site
python -m http.server 8000       # 打开 http://localhost:8000
```

也可以直接双击 `index.html`：首页、目录、正文、图片都能正常看。
唯一例外是 `contentFile` 引用的 `.md` 文件——浏览器不允许 `file://` 读取本地文件，
这种写法必须用 http 访问。

部署到公网：把整个目录上传到任意静态托管（GitHub Pages / 对象存储 / Nginx）即可。
站点用的是 hash 路由（`#/s/…`），**不需要任何服务端 rewrite 配置**，
刷新页面也不会 404。

## 四、页面能力

- **首页**：章节目录，列出每章每节，显示摘要与「N 张图 · N 个附件」
- **侧边栏**：常驻完整目录，当前节高亮；手机上折叠成「目录」按钮
- **内容页**：面包屑、正文排版（标题 / 段落 / 列表 / 代码块 / 引用）、教材图片区、配套文档区
- **图片**：`loading="lazy"` 懒加载，点击放大查看原图，支持左右切换与 `Esc` 关闭
- **文档**：PDF 用 iframe 内嵌预览，同时提供「在新标签页打开」和「下载」
- **上一节 / 下一节**：内容页底部按钮，第一节显示「返回目录」

## 五、关于之前的白屏

排查结论：**不是构建报错（本项目零构建），也不是资源 404**（线上与本地文件字节数一致，
`index.html` / CSS / JS 全部 200）。原版本是纯 JS 渲染，一旦脚本因环境原因没执行完，
页面就会留下空白且没有任何提示。

本次做了三处加固，即使出问题也能看见原因：

1. `index.html` 骨架里直接写好标题等可见内容，不再全靠 JS 填充
2. 全局 `error` 捕获 + 渲染过程 `try/catch`，错误显示在页面顶部的红色提示条里
3. 加了 `<noscript>` 提示，以及首屏「正在加载目录…」占位

## 六、目录结构

```
personal-site/
├─ index.html              页面骨架
├─ assets/
│  ├─ style.css            样式（配色变量在 :root，含深色模式）
│  ├─ markdown.js          极简 Markdown 渲染（无依赖）
│  ├─ viewer.js            图片放大查看（无依赖）
│  └─ app.js               路由与页面渲染
├─ data/
│  ├─ chapters.js          ★ 章节与正文
│  └─ catalog.js           可选：首页底部「延伸链接」，不需要可删除
├─ content/
│  ├─ images/              ★ 教材图片
│  └─ text/                ★ PDF / 文档
└─ tools/                  生成占位示例的脚本，真实内容到位后可删除
```

`data/catalog.js` 是上一版的外部链接目录，现在作为首页底部可选的「延伸链接」区块保留。
不需要的话，删掉这个文件、并去掉 `index.html` 里对应的一行 `<script>` 即可。
