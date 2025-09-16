---
title: "🧮 PHY1001 LEC1-5 基础运动学与牛顿力学"
date: 2025-09-16T11:29:34+08:00
draft: false
summary: "CUHKSZ 大一/大二课程 PHY1001 基础运动学与牛顿力学的 important takeaway"
categories: 
- SSE
tags: 
- PHY1001
featured_image: "/images/phy1.jpg"
---



# PHY week1

- 基础微分方程：
$$a={dv\over{dt}},\ v={dx\over{dt}}$$

- 变加速度位移方程(用于推 导 v(x))：
  $$a=\boxed{a(v)}={dv\over{dt}}={dv\over{dx}}\times{dx\over{dt}}=\boxed{v\ dv\over{dx}}\to\ \int_{v_0}^{v_t}{v\over{a(v)}}dv=\int_{x_0}^{x_t} dx=\Delta x\to v(x)=...$$
  (需要尽量剥离 a(v)中的 v)

- 正交分解：

$$Orthodecomp.：\vec r(t)=\vec v(0)t+{1\over 2}at^2\to r_x(t)=v_x(0)+{1\over 2}at^2$$

- 30 degrees north to east：北偏东 30°
- 向量叉乘：

$$(x_1,x_2,x_3) \times (y_1,y_2,y_3) = \begin{vmatrix}x_1&x_2&x_3\\y_1&y_2&y_3\\\vec i&\vec j&\vec k\end{vmatrix}\ \ (反斜方向为正项)$$

<br>

<br>

# PHY week2

- 匀速圆周运动公式：
$$v=ωr,\ \ \vec a={\vec v^2\over r}=ω^2={4\pi ^2r\over T^2}$$
$$v={2\pi r\over T},\ \ ω={2\pi\over T}$$

- 牛顿三定理：
$$NFL:\ \vec F_{net}=0\iff const\ \vec v\ ,\ \vec a=0$$
$$NSL:\ \vec F_{net}=m\vec a,\ \ \vec F_{x\ net}=m\vec a_x\ ...$$
$$NTL:for\ two\ entities\ A\ \&\ B:\ ∀\  \vec F_{AB},\ ∃\ \vec F_{BA},\ \vec F_{AB}=-F_{BA}$$

- 变加速度时间方程(用于推导 v(t), x(t) 和 a(t))
$$a={dv\over dt}={F(v)\over m}\to \int_{v_0}^{v_t}{1\over F(v)}dv=\int_0^t{1\over m}dt\to v(t)=...$$
(需要尽量剥离 F(v)中的 v)
$$trivially,\ a(t)={d\ v(t)\over dt};\ \ x(t)=\int_0^t v(t)\ dt$$

用小量等价或泰勒首项化成分式/幂次比较，常用等价（x→0）：
- sin x ~ x，tan x ~ x，arcsin x ~ x
- 1 - cos x ~ x^2/2
- e^x - 1 ~ x，ln(1+x) ~ x
- √(1+x) - 1 ~ x/2
- a^x - 1 ~ x ln a（a>0）

<br>

<br>

# PHY week3

<br>

### 斯多克斯模型
理想黏性流体阻力方程：(只适用于高黏度流体中的低速运动)$$f = kv$$
比如用“变加速度时间方程”(from week2)可以推导 铁球在油中 位移、速度和加速度随时间的变化公式：$$ma_y = mg - kv_y\ \to m \frac{dv_y}{dt} = mg - kv_y\ \to v_y(t) = v_t \big(1 - e^{-\tfrac{k}{m}t}\big)$$



<br>

### 压强差模型
理想惯性流体阻力方程：（只用于低黏度流体中的高速运动）$$drag:\ D = \tfrac{1}{2} C \rho A,\ \ drag\ force:\ f = Dv^2\ \ equillibrium:\  \tfrac{1}{2} C \rho A v_t^2 - F_g = ma $$
- C：阻力系数（无量纲，取决于形状、流动状态）
- ρ：流体密度
- A：迎风面积（截面积）
- v：相对流速（逆流逆风速度正叠加）

比如计算半径为 R 的水滴在空气中的最终速度满足：$$\tfrac{1}{2}C \rho_{air} \pi R^2 v_t^2 = {4\over3}\pi R^3 \rho_{water}g$$
