/* ==========================================================================
 * 站点渲染与路由
 *   #/            首页（章节目录）
 *   #/s/<节 id>   章节内容页
 *
 * 使用 hash 路由：不需要任何服务端 rewrite 配置，静态托管直接可用，
 * 也不会出现刷新 404 的问题。
 *
 * 防白屏：所有渲染都包在 try/catch 里，并把错误显示在页面上；
 *         数据缺失、正文加载失败也都有可见提示，不会留下空白页。
 * ========================================================================== */

(function () {
  'use strict';

  var byId = function (id) { return document.getElementById(id); };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  function showFatal(msg) {
    var box = byId('fatal');
    if (!box) return;
    box.hidden = false;
    box.textContent = '页面出错了：' + msg;
  }

  /* ---------- 数据 ---------- */

  var DATA = window.CHAPTERS || {};
  var SITE = DATA.site || {};
  var chapters = Array.isArray(DATA.chapters) ? DATA.chapters : [];

  // 扁平化成"上一节 / 下一节"需要的顺序表
  var flat = [];
  chapters.forEach(function (ch) {
    (ch.sections || []).forEach(function (sec) {
      flat.push({ chapter: ch, section: sec });
    });
  });

  var indexById = {};
  flat.forEach(function (item, i) { indexById[item.section.id] = i; });

  /* ---------- 站点头部 ---------- */

  document.title = SITE.title || '讲义';
  byId('site-title').textContent = SITE.title || '讲义';
  byId('site-subtitle').textContent = SITE.subtitle || '';
  byId('site-desc').textContent = SITE.description || '';
  byId('footer-text').textContent = SITE.footer || '';
  var siteLink = byId('site-link');
  if (siteLink) siteLink.href = '#/';

  /* ---------- 侧边栏目录（首页与内容页共用） ---------- */

  var sidebarList = byId('sidebar-list');

  function buildSidebar() {
    sidebarList.textContent = '';

    chapters.forEach(function (ch) {
      var li = el('li', 'nav-chapter');
      li.appendChild(el('span', 'nav-chapter-title', ch.title));

      var ul = el('ul', 'nav-sections');
      (ch.sections || []).forEach(function (sec) {
        var sli = el('li');
        var a = el('a', 'nav-link', sec.title);
        a.href = '#/s/' + encodeURIComponent(sec.id);
        a.dataset.id = sec.id;
        sli.appendChild(a);
        ul.appendChild(sli);
      });

      li.appendChild(ul);
      sidebarList.appendChild(li);
    });

    var home = el('li', 'nav-chapter');
    var ha = el('a', 'nav-link nav-home', '← 返回首页');
    ha.href = '#/';
    home.appendChild(ha);
    sidebarList.appendChild(home);
  }

  function markActive(id) {
    Array.prototype.forEach.call(sidebarList.querySelectorAll('.nav-link'), function (a) {
      if (a.dataset.id && id && a.dataset.id === id) a.classList.add('is-active');
      else a.classList.remove('is-active');
    });
  }

  /* ---------- 首页 ---------- */

  function renderHome() {
    var main = byId('view');
    main.textContent = '';
    markActive(null);
    document.title = SITE.title || '讲义';

    var intro = el('div', 'home-intro');
    intro.appendChild(el('h2', 'page-title', '章节目录'));
    intro.appendChild(el('p', 'page-meta',
      '共 ' + chapters.length + ' 章 · ' + flat.length + ' 节。点击任意一节即可阅读。'));
    main.appendChild(intro);

    if (!flat.length) {
      main.appendChild(el('p', 'notice',
        '还没有任何章节内容。请在 data/chapters.js 里添加 chapters 数据。'));
      return;
    }

    chapters.forEach(function (ch) {
      var block = el('section', 'home-chapter');
      block.appendChild(el('h3', 'home-chapter-title', ch.title));
      if (ch.note) block.appendChild(el('p', 'home-chapter-note', ch.note));

      var ul = el('ul', 'home-sections');
      (ch.sections || []).forEach(function (sec) {
        var li = el('li', 'home-section');
        var a = el('a', 'home-section-link', sec.title);
        a.href = '#/s/' + encodeURIComponent(sec.id);
        li.appendChild(a);

        if (sec.summary) li.appendChild(el('p', 'home-section-summary', sec.summary));

        var bits = [];
        if ((sec.images || []).length) bits.push(sec.images.length + ' 张图');
        if ((sec.docs || []).length) bits.push(sec.docs.length + ' 个附件');
        if (bits.length) li.appendChild(el('p', 'home-section-meta', bits.join(' · ')));

        ul.appendChild(li);
      });

      block.appendChild(ul);
      main.appendChild(block);
    });

    // 原有的外部链接目录（可选：data/catalog.js 存在时才显示）
    if (window.SITE_DATA && Array.isArray(window.SITE_DATA.catalog) &&
        window.SITE_DATA.catalog.length) {
      var extra = el('section', 'home-chapter');
      extra.appendChild(el('h3', 'home-chapter-title', '延伸链接'));
      var eul = el('ul', 'home-sections');

      window.SITE_DATA.catalog.forEach(function (cat) {
        var items = cat.items || [];
        (cat.groups || []).forEach(function (g) { items = items.concat(g.items || []); });
        var li = el('li', 'home-section');
        li.appendChild(el('span', 'home-section-link is-plain', cat.title));

        var sub = el('ul', 'home-links');
        items.forEach(function (it) {
          if (!it.url) return;
          var sli = el('li');
          var a = el('a', null, it.title);
          a.href = it.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          sli.appendChild(a);
          sub.appendChild(sli);
        });
        li.appendChild(sub);
        eul.appendChild(li);
      });

      extra.appendChild(eul);
      main.appendChild(extra);
    }
  }

  /* ---------- 内容页 ---------- */

  function renderSection(id) {
    var main = byId('view');
    main.textContent = '';

    var pos = indexById[id];
    if (pos === undefined) {
      main.appendChild(el('h2', 'page-title', '没有找到这一节'));
      main.appendChild(el('p', 'notice',
        '链接里的节 id「' + id + '」不存在，请从左侧目录重新选择。'));
      var back = el('a', 'btn', '← 返回目录');
      back.href = '#/';
      main.appendChild(back);
      return;
    }

    markActive(id);

    var item = flat[pos];
    var sec = item.section;
    var ch = item.chapter;

    document.title = sec.title + ' · ' + (SITE.title || '讲义');

    // 面包屑
    var crumb = el('nav', 'crumbs');
    var homeA = el('a', null, SITE.title || '首页');
    homeA.href = '#/';
    crumb.appendChild(homeA);
    crumb.appendChild(el('span', 'sep', '›'));
    crumb.appendChild(el('span', null, ch.title));
    crumb.appendChild(el('span', 'sep', '›'));
    crumb.appendChild(el('span', 'crumb-current', sec.title));
    main.appendChild(crumb);

    main.appendChild(el('h1', 'section-title', sec.title));
    if (sec.summary) main.appendChild(el('p', 'section-summary', sec.summary));

    // 正文
    var body = el('article', 'md');
    main.appendChild(body);

    if (sec.contentFile && typeof fetch !== 'function') {
      body.appendChild(el('p', 'notice',
        '当前浏览器不支持读取外部正文文件（' + sec.contentFile +
        '）。请把正文直接写在 data/chapters.js 的 content 字段里，或换用较新的浏览器。'));
    } else if (sec.contentFile) {
      body.appendChild(el('p', 'notice', '正在读取正文文件：' + sec.contentFile));
      // 显式解析成绝对地址，避免页面带 <base> 或部署在子目录时取错路径
      var fileUrl = new URL(sec.contentFile, location.href).href;
      fetch(fileUrl)
        .then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.text();
        })
        .then(function (txt) {
          body.textContent = '';
          body.appendChild(window.renderMarkdown(txt));
        })
        .catch(function (err) {
          body.textContent = '';
          body.appendChild(el('p', 'notice',
            '正文文件读取失败（' + err + '）：' + sec.contentFile +
            '。若是直接双击 index.html 打开的，浏览器不允许读取本地文件，' +
            '请用本地服务器访问，或把正文直接写在 data/chapters.js 的 content 字段里。'));
        });
    } else if (sec.content) {
      body.appendChild(window.renderMarkdown(sec.content));
    } else {
      body.appendChild(el('p', 'notice', '本节还没有正文，可在 data/chapters.js 中补充 content。'));
    }

    // 教材图片
    var images = sec.images || [];
    if (images.length) {
      main.appendChild(el('h2', 'block-title', '教材图片'));
      var grid = el('div', 'img-grid');
      var viewerItems = [];

      images.forEach(function (im, i) {
        var fig = el('figure', 'img-card');
        var wrap = el('button', 'img-frame');
        wrap.type = 'button';
        wrap.setAttribute('aria-label', '放大查看：' + (im.caption || im.src));

        var img = el('img', 'img-thumb');
        img.src = im.src;
        img.alt = im.caption || '';
        // 懒加载：用 setAttribute 确保属性真正落到 DOM 上
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        wrap.appendChild(img);
        wrap.appendChild(el('span', 'img-zoom', '点击放大'));
        fig.appendChild(wrap);

        if (im.caption) fig.appendChild(el('figcaption', 'img-cap', im.caption));
        grid.appendChild(fig);

        viewerItems.push({ src: im.src, caption: im.caption || '' });

        wrap.addEventListener('click', function () {
          window.ImageViewer.open(viewerItems, i);
        });
      });

      main.appendChild(grid);
    }

    // 附件（PDF / 文档）
    var docs = sec.docs || [];
    if (docs.length) {
      main.appendChild(el('h2', 'block-title', '配套文档'));
      docs.forEach(function (doc) {
        var box = el('div', 'doc-card');
        var head = el('div', 'doc-head');
        head.appendChild(el('span', 'doc-name', doc.title || doc.path));

        var open = el('a', 'doc-link', '在新标签页打开 ↗');
        open.href = doc.path;
        open.target = '_blank';
        open.rel = 'noopener noreferrer';
        head.appendChild(open);

        var dl = el('a', 'doc-link', '下载');
        dl.href = doc.path;
        dl.setAttribute('download', '');
        head.appendChild(dl);

        box.appendChild(head);

        var frame = el('iframe', 'doc-frame');
        frame.src = doc.path;
        frame.loading = 'lazy';
        frame.setAttribute('title', doc.title || doc.path);
        box.appendChild(frame);

        main.appendChild(box);
      });
    }

    // 上一节 / 下一节
    var nav = el('nav', 'pager');
    if (pos > 0) {
      var prev = el('a', 'pager-btn', '← ' + flat[pos - 1].section.title);
      prev.href = '#/s/' + encodeURIComponent(flat[pos - 1].section.id);
      nav.appendChild(prev);
    } else {
      var prevHome = el('a', 'pager-btn', '← 返回目录');
      prevHome.href = '#/';
      nav.appendChild(prevHome);
    }
    if (pos < flat.length - 1) {
      var next = el('a', 'pager-btn is-next', flat[pos + 1].section.title + ' →');
      next.href = '#/s/' + encodeURIComponent(flat[pos + 1].section.id);
      nav.appendChild(next);
    }
    main.appendChild(nav);
  }

  /* ---------- 路由 ---------- */

  function closeNav() {
    document.body.classList.remove('nav-open');
  }

  function route() {
    try {
      var hash = location.hash || '';
      var m = hash.match(/^#\/s\/(.+)$/);
      closeNav();
      if (m) renderSection(decodeURIComponent(m[1]));
      else renderHome();
      window.scrollTo(0, 0);
    } catch (err) {
      showFatal(err && err.message ? err.message : String(err));
    }
  }

  var toggle = byId('nav-toggle');
  toggle.addEventListener('click', function () {
    document.body.classList.toggle('nav-open');
  });

  sidebarList.addEventListener('click', function (e) {
    var node = e.target;
    while (node && node !== sidebarList) {
      if (node.tagName === 'A') { closeNav(); return; }
      node = node.parentNode;
    }
  });

  /* ---------- 启动 ---------- */

  window.addEventListener('hashchange', route);

  window.addEventListener('error', function (e) {
    showFatal(e.message || '未知错误');
  });

  try {
    buildSidebar();
    route();
    byId('boot').hidden = true;   // 首屏骨架里的"正在加载"提示
  } catch (err) {
    showFatal(err && err.message ? err.message : String(err));
    byId('boot').hidden = true;
  }
})();
