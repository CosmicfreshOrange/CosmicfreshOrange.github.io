---
title: "非线性规划（max-min）转化为线性规划"
description: "上海海事大学 2018 年考研试题 — max-min 型目标函数转化为标准线性规划的完整思路"
date: 2026-06-04 23:00:00 +0800
categories: [运筹学]
tags: [线性规划, 非线性规划, max-min, 考研]
math: true
---

## 原题

将下列问题改写成线性规划问题：

$$
\max_{x_i} \left\{ \min \left(\sum_{i=1}^{m} a_{i1} x_i,\ \sum_{i=1}^{m} a_{i2} x_i,\ \cdots,\ \sum_{i=1}^{m} a_{in} x_i\right) \right\}
$$

$$
\text{s.t.} \quad
\begin{cases}
x_1 + x_2 + \cdots + x_m = 1 \\[4pt]
x_i \geqslant 0 \quad (i = 1, 2, \cdots, m)
\end{cases}
$$

---

## 难点分析

目标函数是一个 **max-min** 结构——先对 $n$ 个线性表达式取最小，再对这个最小值求最大。这种嵌套结构是**非线性**的，不能直接用单纯形法求解。

---

## 转化思路

**核心技巧：引入辅助变量 $v$，将 min 的"取最小值"逻辑拆解为一组不等式约束。**

### 第一步：令 $v$ 等于那个 min

设：

$$
v = \min\left(\sum_{i=1}^{m} a_{i1} x_i,\ \sum_{i=1}^{m} a_{i2} x_i,\ \cdots,\ \sum_{i=1}^{m} a_{in} x_i\right)
$$

此时目标函数变为：

$$
\max\ z = v
$$

### 第二步：把 min 的含义写成约束

如果 $v$ 是这 $n$ 个表达式的最小值，那意味着 **$v$ 小于等于其中每一个表达式**：

$$
v \leqslant \sum_{i=1}^{m} a_{ij} x_i \quad (j = 1, 2, \cdots, n)
$$

等价写成常见形式：

$$
\sum_{i=1}^{m} a_{ij} x_i \geqslant v \quad (j = 1, 2, \cdots, n)
$$

### 第三步：为什么这样等价？

- 目标 $\max\ v$ 会把 $v$ 往**上推**。
- 但约束 $\sum a_{ij}x_i \geqslant v$ 限制了 $v$ 不能超过任何一个表达式。
- 在最优解处，$v$ 自然等于所有 $\sum a_{ij}x_i$ 中的最小值——正好还原了原问题的 max-min 语义。

---

## 最终线性规划形式

$$
\max\ z = v
$$

$$
\text{s.t.} \quad
\begin{cases}
\displaystyle\sum_{i=1}^{m} a_{ij} x_i \geqslant v \quad (j = 1, 2, \cdots, n) \\[12pt]
x_1 + x_2 + \cdots + x_m = 1 \\[4pt]
x_i \geqslant 0 \quad (i = 1, 2, \cdots, m) \\[4pt]
v \text{ 无非负限制（自由变量）}
\end{cases}
$$

> **注意**：$v$ 是自由变量（没有 $\geqslant 0$ 的限制）。如果题目要求所有变量非负，令 $v = v_1 - v_2$，其中 $v_1, v_2 \geqslant 0$，代入即可。

---

## 小结

| 关键步骤 | 操作 |
|---------|------|
| ① 引入变量 | 令 $v = \min(\cdots)$ |
| ② 重构目标 | $\max\ z = v$ |
| ③ 拆 min 为约束 | $n$ 个不等式：$\sum a_{ij}x_i \geqslant v$ |
| ④ 保留原约束 | $x_1+\cdots+x_m=1,\ x_i \geqslant 0$ |

这类 **max-min → 线性规划** 的转换是考研常考题型，本质就是把"取最小值"用一组不等式约束来表达，然后借助目标函数 $\max\ v$ 自动把 $v$ 顶到 min 的位置。

> 约束数量核对：$\sum_{i=1}^{m} a_{ij} x_i \geqslant v$ 共 $n$ 个，对应 $j = 1,2,\cdots,n$。
