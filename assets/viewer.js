/* ==========================================================================
 * 图片查看器（Lightbox，无依赖）
 * 点击正文中的图片后全屏查看原图，支持左右切换、Esc 关闭。
 * ========================================================================== */

(function () {
  'use strict';

  var root = null;
  var img = null;
  var cap = null;
  var counter = null;
  var btnPrev = null;
  var btnNext = null;
  var loading = null;
  var list = [];
  var idx = 0;

  function build() {
    root = document.createElement('div');
    root.className = 'lb';
    root.hidden = true;

    var bar = document.createElement('div');
    bar.className = 'lb-bar';

    counter = document.createElement('span');
    counter.className = 'lb-count';

    var spacer = document.createElement('span');
    spacer.style.flex = '1';

    var close = document.createElement('button');
    close.className = 'lb-btn';
    close.type = 'button';
    close.textContent = '×';
    close.setAttribute('aria-label', '关闭');

    bar.appendChild(counter);
    bar.appendChild(spacer);
    bar.appendChild(close);

    var stage = document.createElement('div');
    stage.className = 'lb-stage';

    btnPrev = document.createElement('button');
    btnPrev.className = 'lb-nav lb-prev';
    btnPrev.type = 'button';
    btnPrev.textContent = '‹';
    btnPrev.setAttribute('aria-label', '上一张');

    btnNext = document.createElement('button');
    btnNext.className = 'lb-nav lb-next';
    btnNext.type = 'button';
    btnNext.textContent = '›';
    btnNext.setAttribute('aria-label', '下一张');

    img = document.createElement('img');
    img.className = 'lb-img';
    img.alt = '';

    loading = document.createElement('p');
    loading.className = 'lb-loading';
    loading.textContent = '正在加载原图…';
    loading.hidden = true;

    stage.appendChild(btnPrev);
    stage.appendChild(img);
    stage.appendChild(btnNext);

    cap = document.createElement('p');
    cap.className = 'lb-cap';

    root.appendChild(bar);
    root.appendChild(stage);
    root.appendChild(loading);
    root.appendChild(cap);

    close.addEventListener('click', hide);
    btnPrev.addEventListener('click', function () { step(-1); });
    btnNext.addEventListener('click', function () { step(1); });
    // 点击图片以外的区域关闭
    root.addEventListener('click', function (e) {
      if (e.target === root || e.target === stage) hide();
    });
    img.addEventListener('click', function (e) { e.stopPropagation(); });

    document.body.appendChild(root);

    document.addEventListener('keydown', function (e) {
      if (root.hidden) return;
      if (e.key === 'Escape') hide();
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    });
  }

  function step(d) {
    if (list.length < 2) return;
    idx = (idx + d + list.length) % list.length;
    show();
  }

  function show() {
    var item = list[idx];
    if (!item) return;
    loading.hidden = false;
    img.classList.add('is-switching');
    img.src = item.src;
    img.alt = item.caption || '';
    cap.textContent = item.caption || '';
    counter.textContent = (idx + 1) + ' / ' + list.length;
    var multi = list.length > 1;
    btnPrev.hidden = !multi;
    btnNext.hidden = !multi;
  }

  function onLoaded() {
    loading.hidden = true;
    img.classList.remove('is-switching');
  }

  function hide() {
    root.hidden = true;
    document.body.classList.remove('lb-open');
    img.removeAttribute('src');
  }

  function open(items, index) {
    if (!root) {
      build();
      img.addEventListener('load', onLoaded);
      img.addEventListener('error', function () {
        loading.textContent = '图片加载失败，请确认文件路径是否正确。';
      });
    }
    list = items || [];
    idx = index || 0;
    if (!list.length) return;
    loading.textContent = '正在加载原图…';
    root.hidden = false;
    document.body.classList.add('lb-open');
    show();
  }

  window.ImageViewer = { open: open, close: hide };
})();
