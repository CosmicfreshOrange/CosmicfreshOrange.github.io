---
title: "Chirpy 博客 MathJax 公式无法渲染 — 排查全记录"
description: '从"公式全挂"到逐个定位根因：ASCII引号截断YAML导致MathJax不加载，\def\color hack报错退出，以及Chirpy自带polyfill被墙'
date: 2026-06-21 00:30:00 +0800
categories: [博客]
tags: [Chirpy, MathJax, Jekyll, 公式渲染, 踩坑]
math: true
---

## 现象

两篇运筹学文章发布后，数学公式完全不显示——所有 `$$...$$` 和 `$...$` 内的 LaTeX 代码原样暴露在页面上，MathJax 根本没跑起来。

## 排查过程

### 第一层：以为 Chirpy 7.x 有 Bug

网上搜到 [Chirpy Issue #2351](https://github.com/cotes2020/jekyll-theme-chirpy/issues/2351)，说 `>= 7.0` 版本 MathJax 有缓存相关的渲染问题。加上看了 `_config.yml` 里没配 `math_engine`，以为是配置缺失。

但仔细对比发现：**匈牙利算法那篇公式正常**，就两篇「转线性规划」挂了。问题不在主题本身。

### 第二层：`\def\color` hack 报错

在 `分式规划转线性规划 — Charnes-Cooper 变换` 开头发现了这个：

```tex
$$
\def\color#1#2{#2}
$$
```

文章里用 `\color{#cf5d2c}{text}` 给关键变量着色，但怕 `\color` 扩展没加载，于是用 `\def` 重定义它——让 `\color` 只输出文字忽略颜色。

问题在于 **`\def` 需要 `newcommand` 扩展**。Chirpy 自带的 MathJax 3.2.2 组件虽然包含这个扩展，但实际的加载机制有坑：当 `\def` 在页面最顶部执行时，如果扩展还没初始化完成，MathJax 直接报错退出，后面所有公式全部罢工。

**修复**：删掉 `\def\color` hack，全文替换 `\color{#xxx}{text}` → `\textcolor{#xxx}{text}`。

### 第三层：CloudFlare polyfill 被墙

继续看 Chirpy 的 MathJax 加载链（`_includes/js-selector.html`）：

```html
<script src="/assets/js/data/mathjax.js"></script>
<script async src="https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?features=es6"></script>
<script async src="cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-chtml.js"></script>
```

中间的 **CloudFlare polyfill** 在国内加载极慢甚至直接超时。虽然 `async` 不会阻塞页面，但 polyfill 失败后某些浏览器会延迟后续脚本执行，导致 MathJax 迟迟不加载。

**修复**：创建 `_includes/js-selector.html` 覆盖主题文件，砍掉 polyfill，配置内联，直接用 jsdelivr CDN。

```html
{% if page.math %}
  <script>
    MathJax = {
      tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        tags: 'ams'
      }
    };
  </script>
  <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js"></script>
{% endif %}
```

（Chirpy 7.6.0 其实已经去掉了 polyfill，但 7.5 还有。）

### 第四层（根因）：ASCII 引号截断 YAML

修完上面两个问题推送后，「Charnes-Cooper 变换」那篇**公式还是不显示**。

直接拉取部署后的 HTML，发现 `<title>` 标签是空的：

```html
<title> | CosOrange</title>
```

这说明 Jekyll 根本没读到 `page.title`——**frontmatter 解析失败了**。`page.math` 自然也不生效，`js-selector.html` 里的 `{% if page.math %}` 永远是 false。

用 `xxd` 看 description 字段的十六进制：

```
00000010: 8e22 e4b8 bae4 bb80 e4b9 88e5 819a 22e5  ."............".
00000020: 88b0 22e6 808e e4b9 88e5 819a 22e5 868d  .."........."...
```

`22` 是 ASCII 双引号 `"`（U+0022）！原来：

```yaml
description: "从"为什么做"到"怎么做"再到"为什么这样做"，..."
```

这里面 `"为什么做"` 的引号不是中文全角引号 `""`（U+201C/U+201D），而是**英文半角引号** `""`（U+0022）。YAML 解析器读到第一个 `"` 以为字符串结束了——后面全部变成非法 YAML，整个 frontmatter 报废。

**修复**：外层 YAML 定界符改用单引号：

```yaml
description: '从"为什么做"到"怎么做"再到"为什么这样做"，拆解...'
```

推送后页面标题恢复，MathJax 正常加载。

## 总结

| 层级 | 问题 | 症状 | 修复 |
|------|------|------|------|
| 第一层 | `\def\color` hack | MathJax 报错退出 | 删除，换 `\textcolor` |
| 第二层 | CloudFlare polyfill | MathJax 加载慢/失败 | 覆盖 js-selector，砍掉 polyfill |
| **第三层（根因）** | **description 内含 ASCII `"`** | **frontmatter 解析失败** | **外层改用单引号** |

> 三层问题叠加在一起，每一层都能独立导致公式罢工。排查时一层一层剥开，最后用 `xxd` 看十六进制才锁定真凶。

## 教训

1. **YAML 字符串里有引号？外层用单引号**，别赌它是全角还是半角。
2. Chirpy 7.5 的 CloudFlare polyfill 国内加载有问题，升级到 7.6 或手动覆盖。
3. MathJax 的 `\def` / `\newcommand` 不是默认可用的，别在博客里搞宏定义 hack。
4. 排查 Jekyll 问题优先看 `<title>`——它是 frontmatter 是否解析成功的晴雨表。
