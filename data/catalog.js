/* ==========================================================================
 * 目录数据 —— 整个网站唯一需要维护的文件
 * --------------------------------------------------------------------------
 * 改完保存，刷新页面即可生效，无需改动任何其他文件。
 *
 * 结构说明：
 *   site         站点头部信息
 *   catalog[]    分类数组（一级目录，渲染为 <h2>）
 *     ├ title    分类名（必填）
 *     ├ note     分类说明，可省略
 *     ├ items[]  直接挂在分类下的条目，可省略
 *     └ groups[] 子分组（二级目录，渲染为 <h3>），可省略
 *                 └ title / note / items[]
 *
 *   条目 item：
 *     title  条目标题（必填）
 *     url    链接地址（必填；留空则渲染为灰色不可点击的“待补充”条目）
 *     desc   一句话简介，可省略
 *
 * 新增一个分类：复制下面任意一个 { ... } 块，改内容即可。
 * 新增一个条目：在 items 数组里加一行 { title: "...", url: "...", desc: "..." }。
 * ========================================================================== */

window.SITE_DATA = {
  site: {
    title: '我的个人目录',
    subtitle: '一个把分散在各处的链接整理成目录的地方',
    description: '左侧是目录，右侧是条目。点击条目会在新标签页打开。',
    footer: '本站为静态页面，目录数据保存在 data/catalog.js 中。'
  },

  catalog: [
    {
      title: '教学资料',
      note: '日常备课与命题用到的素材，按用途分组。',
      groups: [
        {
          title: '讲义与教案',
          items: [
            { title: '必修一 · 全套讲义', url: 'https://example.com/bx1', desc: '按章分节整理，含例题与课后训练。' },
            { title: '选择性必修二 · 磁场专题', url: 'https://example.com/sx2-magnetic', desc: '边界磁场、旋转圆、放缩圆三类模型。' },
            { title: '知识点框架图', url: 'https://example.com/framework', desc: '高中物理全部知识点的层级结构图。' },
            { title: '实验教案 · 洛伦兹力演示', url: 'https://example.com/lorentz-demo', desc: '含演示视频与课堂提问设计。' }
          ]
        },
        {
          title: '试题与试卷',
          items: [
            { title: '本地试题库', url: 'https://example.com/bank', desc: '按教材章节挂靠考点，支持按节检索。' },
            { title: '十年高考真题分项汇编', url: 'https://example.com/gaokao', desc: '按专题拆分，可直接用于选题组卷。' },
            { title: '自主命题存档', url: 'https://example.com/self-made', desc: '原创与改编题，附考点覆盖与原型溯源。' },
            { title: '待整理 · 扫描件', url: '', desc: '早期扫描卷，尚未录入题库。' }
          ]
        }
      ]
    },

    {
      title: '工具与效率',
      note: '高频使用、值得收藏的外链。',
      items: [
        { title: '公式编辑器', url: 'https://example.com/latex', desc: '在线 LaTeX，导出图片直接贴进 Word。' },
        { title: '物理作图', url: 'https://example.com/draw', desc: '画受力图与轨迹图，支持导出 SVG。' },
        { title: '单位与常量速查', url: 'https://example.com/constants', desc: '常用物理常量与单位换算。' }
      ],
      groups: [
        {
          title: '素材来源',
          items: [
            { title: '教材电子版', url: 'https://example.com/textbook', desc: '人教版各册 PDF，可检索。' },
            { title: '公开课视频库', url: 'https://example.com/videos', desc: '按章节索引的课堂实录。' }
          ]
        }
      ]
    },

    {
      title: '学习与实践',
      note: '自己在读、在写、在折腾的东西。',
      items: [
        { title: '读书笔记', url: 'https://example.com/notes', desc: '按主题归档，偏物理教学与认知科学。' },
        { title: '教学复盘', url: 'https://example.com/retro', desc: '每学期一篇，记录哪些讲法有效。' }
      ],
      groups: [
        {
          title: '小项目',
          items: [
            { title: '试题库管理系统', url: 'https://example.com/project-bank', desc: '本地部署，服务端 + 网页 + SQLite。' },
            { title: '实验数据采集脚本', url: 'https://example.com/project-daq', desc: '串口读取数据并实时作图。' }
          ]
        }
      ]
    },

    {
      title: '关于我',
      items: [
        { title: '个人主页', url: 'https://example.com/about', desc: '简介与联系方式。' },
        { title: '邮箱', url: 'mailto:me@example.com', desc: '欢迎交流教学与命题。' }
      ]
    }
  ]
};
