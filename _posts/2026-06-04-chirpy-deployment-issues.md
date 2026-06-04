---
title: "Chirpy 博客部署中遇到的问题及其解决方法"
description: "从零搭建 GitHub Pages + Chirpy 博客的完整踩坑记录"
date: 2026-06-04 23:30:00 +0800
categories: [博客]
tags: [GitHub Pages, Jekyll, Chirpy, 部署]
math: false
---

记录在 Windows 环境下从零搭建 Chirpy 博客并部署到 GitHub Pages 的全过程，以及踩过的坑。

---

## 环境概况

- 操作系统：Windows 11
- 代理：Clash（本地 7897 端口）
- 博客框架：Jekyll + Chirpy 7.5
- 托管：GitHub Pages（免费）

---

## 问题一：GitHub 直连被墙，无法 clone

### 现象

```bash
git clone https://github.com/cotes2020/chirpy-starter.git
# fatal: unable to access '...': Recv failure: Connection was reset
```

### 解决方法

配置 Git 走本地代理：

```bash
git config --global http.proxy http://127.0.0.1:7897
git config --global https.proxy http://127.0.0.1:7897
```

之后 `git clone` 和 `git push` 都正常。

> 如果以后不想走代理了，用 `git config --global --unset http.proxy` 取消。

---

## 问题二：博客首页显示原始 Jekyll 代码

### 现象

打开 `https://username.github.io`，页面内容不是博客，而是：

```
---
layout: home
# Index page
---
```

### 原因

GitHub Pages 的 **Source** 没有设置为 "GitHub Actions"。默认是 "Deploy from a branch"，GitHub 自带的 Jekyll 构建器不认识 Chirpy 主题（Chirpy 不在 GitHub Pages 官方支持的主题白名单里），导致构建失败，直接输出了源文件。

### 解决方法

1. 进入仓库 **Settings → Pages**
2. **Build and deployment → Source** 改为 **GitHub Actions**
3. 保存后，推送一个空 commit 触发重新构建：

```bash
git commit --allow-empty -m "trigger: redeploy"
git push
```

---

## 问题三：Jekyll 默认不显示"未来时间"的文章

### 现象

文章已经推送到 GitHub，Actions 构建成功，但博客首页不显示文章，文章列表为空。

### 原因

文章 front matter 里写的发布时间，在 GitHub Actions 构建时（UTC 时间）还是"未来时间"。Jekyll 默认 `future: false`，会跳过所有未来时间的文章。

例如：文章写 `date: 2026-06-04 23:00:00 +0800`，而构建发生在 UTC 时间 15:00（北京时间 23:00 之前），文章就被跳过了。

### 解决方法

**方法一**（临时）：把文章时间改成过去的时间。

**方法二**（永久）：在 `_config.yml` 里加一行：

```yaml
future: true
```

这样无论什么时候写文章都会正常发布，不会被时区问题卡住。

---

## 问题四：GitHub Actions 绿色成功但网站没更新

### 现象

- Actions 页面显示绿色勾 ✅
- build 和 deploy 两个 job 都成功
- Artifact 有 6.91 MB
- 但网站仍然显示旧内容（或原始代码）

### 排查过程

1. **确认 Source 是 GitHub Actions** → 是
2. **确认 Environments 设置** → github-pages 环境无保护规则、无审核要求
3. **确认构建产物正确** → 在 workflow 中加了 Debug 步骤，输出 `_site/` 内容，确认构建完全正确（`index.html` 11030 字节，文章和静态文件都在）
4. **发现问题**：`htmlproofer` 步骤可能在检查链接后悄悄影响了部署产物的发布

### 解决方法

从 workflow 文件 `.github/workflows/pages-deploy.yml` 中**删掉 htmlproofer 步骤**。只保留：

```yaml
- name: Build site
  run: bundle exec jekyll b -d "_site${{ steps.pages.outputs.base_path }}"
  env:
    JEKYLL_ENV: "production"

- name: Upload site artifact
  uses: actions/upload-pages-artifact@v4
  with:
    path: "_site${{ steps.pages.outputs.base_path }}"
```

也就是 **Build → Upload → Deploy**，中间不需要 Test 步骤。

---

## 问题五：侧边栏博客名称显示不全

### 现象

GitHub 用户名较长时（如 `CosmicfreshOrange`，18 个字符），Chirpy 侧边栏标题被截断。

### 解决方法

在 `_config.yml` 中把 `title` 改短，不一定要和用户名一样。例如改成 `CosOrange`。

---

## 问题六：中文文件路径的 URL 编码

### 现象

静态 HTML 文件放在 `运筹学/解题方法技巧归纳/P1-1_max-min.html`，直接用中文 URL 访问在某些工具（如 curl）中返回 404。

### 原因

中文 URL 需要百分号编码才能被服务器正确识别。浏览器会自动做这件事，所以从网页点链接正常访问。但 curl 等工具不会自动编码。

### 解决方法

不需要特别处理。浏览器会自动将中文 URL 编码为 `%E8%BF%90%E7%AD%B9%E5%AD%A6/...`，用户正常点击链接即可访问。这属于正常行为，不影响使用。

---

## 总结

| 序号 | 问题 | 关键操作 |
|------|------|----------|
| 1 | Git clone 被墙 | `git config --global http.proxy` |
| 2 | 首页显示原始代码 | Settings → Pages → Source 改为 GitHub Actions |
| 3 | 文章不显示 | `_config.yml` 加 `future: true` |
| 4 | Actions 绿勾但未部署 | 删除 workflow 中的 htmlproofer 步骤 |
| 5 | 标题被截断 | 缩短 `_config.yml` 中的 `title` |
| 6 | 中文路径 404 | 无需处理，浏览器自动编码 |

搭建过程总共花了约 2 小时，主要时间都在排查问题四（部署不生效），其他问题都比较直观。希望这篇记录能帮助遇到类似问题的朋友。
