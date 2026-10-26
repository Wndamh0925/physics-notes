/* ==========================================================================
 * 极简 Markdown 渲染器（无依赖）
 * 支持：# ## ### 标题 / - * 无序列表 / 1. 有序列表 / > 引用 /
 *       行首缩进 4 空格的代码块 / --- 分隔线 / **粗** *斜* [文字](链接)
 * 输出 DOM 节点。全程使用 textContent 赋值，不使用 innerHTML，天然避免注入。
 *
 * 标题映射：# → h2，## → h3，### → h4（页面 h1 留给节标题）
 * ========================================================================== */

(function () {
  'use strict';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }

  // 只允许安全协议，挡掉 javascript: 之类的链接
  function safeUrl(url) {
    var u = String(url || '').trim();
    if (/^(https?:|mailto:)/i.test(u)) return u;
    if (/^[./]/.test(u) || /^[^:]+$/.test(u)) return u; // 相对路径
    return '#';
  }

  function isAscii(ch) {
    return !!ch && /[A-Za-z0-9]/.test(ch);
  }

  /* ---------- 行内解析 ---------- */

  var INLINE = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;

  function inlineInto(parent, text) {
    var last = 0;
    var m;
    INLINE.lastIndex = 0;
    while ((m = INLINE.exec(text)) !== null) {
      if (m.index > last) {
        parent.appendChild(document.createTextNode(text.slice(last, m.index)));
      }
      if (m[1] !== undefined) {
        parent.appendChild(el('strong', null, m[1]));
      } else if (m[2] !== undefined) {
        parent.appendChild(el('em', null, m[2]));
      } else {
        var a = el('a', null, m[3]);
        a.href = safeUrl(m[4]);
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        parent.appendChild(a);
      }
      last = m.index + m[0].length;
    }
    if (last < text.length) {
      parent.appendChild(document.createTextNode(text.slice(last)));
    }
  }

  /* ---------- 块级解析 ---------- */

  function render(md) {
    var frag = document.createDocumentFragment();
    if (!md) return frag;

    var lines = String(md).replace(/\r\n?/g, '\n').split('\n');
    var i = 0;

    function flushParagraph(buf) {
      if (!buf.length) return;
      var p = el('p');
      // 中文之间不留空格，英文/数字之间补一个空格
      var text = '';
      for (var k = 0; k < buf.length; k++) {
        if (k > 0 && isAscii(buf[k - 1].slice(-1)) && isAscii(buf[k].slice(0, 1))) {
          text += ' ';
        }
        text += buf[k];
      }
      inlineInto(p, text);
      frag.appendChild(p);
      buf.length = 0;
    }

    var para = [];

    while (i < lines.length) {
      var line = lines[i];

      // 空行：结束当前段落
      if (!line.trim()) {
        flushParagraph(para);
        i++;
        continue;
      }

      // 分隔线
      if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) {
        flushParagraph(para);
        frag.appendChild(el('hr'));
        i++;
        continue;
      }

      // 标题
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        flushParagraph(para);
        var level = Math.min(h[1].length + 1, 6); // # → h2
        var tag = 'h' + level;
        var head = el(tag);
        inlineInto(head, h[2]);
        frag.appendChild(head);
        i++;
        continue;
      }

      // 代码块：行首缩进 4 空格或 1 个 Tab
      if (/^( {4}|\t)/.test(line)) {
        flushParagraph(para);
        var code = [];
        while (i < lines.length && (/^( {4}|\t)/.test(lines[i]) || lines[i].trim() === '')) {
          if (lines[i].trim() === '' && !/^( {4}|\t)/.test(lines[i + 1] || '')) break;
          code.push(lines[i].replace(/^( {4}|\t)/, ''));
          i++;
        }
        while (code.length && code[code.length - 1].trim() === '') code.pop();
        var pre = el('pre');
        pre.appendChild(el('code', null, code.join('\n')));
        frag.appendChild(pre);
        continue;
      }

      // 引用
      if (/^\s*>\s?/.test(line)) {
        flushParagraph(para);
        var quote = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quote.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        var bq = el('blockquote');
        var qp = el('p');
        var qtext = '';
        for (var q = 0; q < quote.length; q++) {
          if (q > 0 && isAscii(quote[q - 1].slice(-1)) && isAscii(quote[q].slice(0, 1))) {
            qtext += ' ';
          }
          qtext += quote[q];
        }
        inlineInto(qp, qtext);
        bq.appendChild(qp);
        frag.appendChild(bq);
        continue;
      }

      // 无序列表
      if (/^\s*[-*+]\s+/.test(line)) {
        flushParagraph(para);
        var ul = el('ul');
        while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
          var li = el('li');
          inlineInto(li, lines[i].replace(/^\s*[-*+]\s+/, ''));
          ul.appendChild(li);
          i++;
        }
        frag.appendChild(ul);
        continue;
      }

      // 有序列表
      if (/^\s*\d+[.)]\s+/.test(line)) {
        flushParagraph(para);
        var ol = el('ol');
        while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
          var oli = el('li');
          inlineInto(oli, lines[i].replace(/^\s*\d+[.)]\s+/, ''));
          ol.appendChild(oli);
          i++;
        }
        frag.appendChild(ol);
        continue;
      }

      para.push(line.trim());
      i++;
    }

    flushParagraph(para);
    return frag;
  }

  window.renderMarkdown = render;
})();
