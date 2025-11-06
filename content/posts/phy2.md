---
title: "🧮 PHY1001 LEC10-15 旋转运动学"
date: 2025-11-06T14:29:34+08:00
draft: false
summary: "CUHKSZ 大一/大二课程 PHY1001 绕轴运动 important takeaway"
categories: 
- SSE
tags: 
- PHY1001
featured_image: "/images/phy2.jpg"
---



# 旋转运动

</br>

## Basics

</br>

- 转动惯量：$I=cMR^2$，粒子型物体 $c=1$，圆盘/柱子绕轴 $c=\tfrac12$ ……
- 动能：$K=\tfrac12 Mv^2+\tfrac12 I_{\rm com}\,\omega^2$
- 力矩：$\vec\tau=\vec r\times\vec F,\ \ \vec\tau_{\rm net}=\dfrac{d\vec L}{dt},\ \ \tau=F_{\rm net}\,r=I_{\rm axis}\,\alpha$，描述让物体沿某轴旋转的倾向
- 角动量：$\vec L=\vec r\times\vec p,\ \ L=rp=rMv=I\omega$
  （叉乘都用右手定则判断方向，$\vec r$ 永远从轴心指向边）
- 对于无外力做功的刚性系，系统角动量守恒：$\vec L_i=\vec L_f$
- 轨道进动 (Precession)：
  - $\text{进动角 } d\phi=\dfrac{dL}{L}$
  - $$\text{进动角速度 }\ \Omega=\frac{d\phi}{dt}=\frac{Mgr}{I\omega}$$

- 不打滑滚动意味着：$s=\theta r$，即质心的位移等于边滚过的距离  
  - 在质心上，$v=v_{\rm COM}+\boldsymbol\omega\times\mathbf r=0$，即 $v_{\rm COM}=\omega r$  
  - 在接地点 $p$ 作为瞬间旋转轴处，$v_p=\boldsymbol\omega\times\mathbf r$ 并且 $a_{\rm COM}=\alpha R$

</br>

</br>

## 滚动滑动问题：两种考虑情况

</br>

**主动轮**：角加速度由“引擎”提供，静摩擦力朝前进方向，负责平动。  
$F_{\rm NET}=f_s=m a_{\rm COM}\le \mu_s N$（不打滑时）  
$\tau=\tau_{\rm applied}-f_s R$  
$a_{\rm COM}=\alpha R$  
解得：$a_C=\dfrac{\tau_{\rm eng}R}{I+mR^2},\qquad
f_s=m\,a_C=\dfrac{m\,\tau_{\rm eng}R}{I+mR^2}\,.$

- 比如一个转动的球被丢在光滑平面上，没有摩擦力就只会在原地打滚。  
- 比如无动力的轮子上坡：摩擦力与重力 $\sin$ 分力方向相反，指向前进方向，做正旋转功。  
  所以同样的轮子上同样的坡，根据 $K=\tfrac12 M v_{\rm com}^2+\tfrac12 I_{\rm COM}\omega^2=\Delta W$，受摩擦力  
  的能到更高的位置。

</br>

**从动轮**：静摩擦力朝受力的反方向，负责转动。  
$F_{\rm NET}=F_{\rm applied}-f_s=m a_{\rm COM}$  
$\tau=f_s R\le \mu_s N R$（不打滑时）  
$a_{\rm COM}=\alpha R$  
解得：$a_C=\dfrac{F}{m+I/R^2},\qquad
f_s=\dfrac{I}{R^2}\,a_C=\dfrac{F I}{I+mR^2}$

</br>

### 例 1：$F$ 离中心 $d$ 拉动半径 $R$ 的可滚动物体，受到 $f_s$，如果不滑动

若假设摩擦力朝后，受力 $F_{\rm NET}=F_{\rm applied}-f_s=m a_{\rm COM}$。

1. 从质心处看：  
   平动：$F-f_s=m a_{\rm COM}$  
   转动：$\tau=F d-f_s R=I\alpha$  
   约束：$a_{\rm COM}=\alpha R$

2. 从瞬间转动轴看：  
   平动：无  
   转动：$\tau_F=F(d+R)=I_P\,\alpha=(I+MR^2)\alpha$  
   约束：$a_{\rm COM}=\alpha R$  
   **摩擦力直接忽略**，因为其力臂为 0

摩擦力朝哪？通过增大力矩会导致摩擦力超运动方向增大。其方向因为受到不能滑动限制，是会改变的。

</br>

### 例 2：被丢在桌上的正在以 $\omega_0$ 旋转的球，受到向运动方向的 $f_k$

$v_{\rm COM}(t)=0+a_{\rm COM} t=\mu_k g\,t$  
$\omega(t)=\omega_0-\alpha t$

- 滑动停止时：$v_{\rm COM}(t')=\omega(t')R$，$a_{\rm COM}=\alpha R$，$f_k=0$
- 机械能不守恒，$f_k$ 做的功部分变成了内能

可以推导出直到滑动停止所需的时间公式：
$$
\boxed{\ t=\frac{\big|\,v_0-\omega_0 R\,\big|}
{\mu_k g\!\left(1+\dfrac{MR^2}{I}\right)}
=\frac{M\big|\,v_0-\omega_0 R\,\big|}
{f_k\!\left(1+\dfrac{MR^2}{I}\right)}\ }
$$
这是只受摩擦力下，停止滑动所需时间的通解。

一般不会考虑初线速度，也就是 $v_0=0\Rightarrow$ 纯滚瞬间的速度与角速度：  
$$v =\frac{I}{I+MR^2}\,\omega_0 R ;\ \  \omega =\frac{I}{I+MR^2}\,\omega_0$$  
能量损失（变为内能）：$\displaystyle \Delta K=-\tfrac12\,\frac{IMR^2}{I+MR^2}\,\omega_0^2$

</br>

</br>

## 力与力矩平衡问题

对于解中心位置、解力的大小或者存在变力的情况下，常用力与力矩平衡解答：
$$
F_{\rm net,\,COM}=0;\ \ \tau_{\rm net}=0
$$
通过选择特殊点作为力矩轴（通常是接触点或质心），可以让一些麻烦的力的力矩为 0

