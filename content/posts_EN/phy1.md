---
title: "⚛️ PHY1001 LEC1-5 Basic Kinematics and Newtonian Mechanics"
date: 2025-09-16T11:29:34+08:00
draft: false
summary: "Important takeaways from PHY1001 at CUHKSZ on basic kinematics and Newtonian mechanics."
categories: 
- SSE
tags: 
- PHY1001
featured_image: "/images/phy1.jpg"
---



# PHY week1

- Basic differential equations:
$$a={dv\over{dt}},\ v={dx\over{dt}}$$

- **Variable-acceleration displacement equation** (used to derive `v(x)`):
  $$a=\boxed{a(v)}={dv\over{dt}}={dv\over{dx}}\times{dx\over{dt}}=\boxed{v\ dv\over{dx}}\to\ \int_{v_0}^{v_t}{v\over{a(v)}}dv=\int_{x_0}^{x_t} dx=\Delta x\to v(x)=...$$
  (One should isolate the `v` inside `a(v)` as much as possible.)

- Orthogonal decomposition:

$$Orthodecomp.：\vec r(t)=\vec v(0)t+{1\over 2}at^2\to r_x(t)=v_x(0)+{1\over 2}at^2$$

- 30 degrees north to east: 30° east of north
- Vector cross product:

$$(x_1,x_2,x_3) \times (y_1,y_2,y_3)\ equals:\ the\ 3\times3\ determinant\ formed\ by\ the\ two\ vectors\ and\ the\ unit\ vectors\ (the\ anti-diagonal\ convention\ gives\ the\ positive\ terms)$$

<br>

<br>

# PHY week2

- Uniform circular motion formulas:
$$v=ωr,\ \ \vec a={\vec v^2\over r}=ω^2={4\pi ^2r\over T^2}$$
$$v={2\pi r\over T},\ \ ω={2\pi\over T}$$
- Newton’s three laws:
$$NFL:\ \vec F_{net}=0\iff const\ \vec v\ ,\ \vec a=0$$
$$NSL:\ \vec F_{net}=m\vec a,\ \ \vec F_{x\ net}=m\vec a_x\ ...$$
$$NTL:for\ two\ entities\ A,\ B:\ ∀\  \vec F_{AB},\ ∃\ \vec F_{BA},\ \vec F_{AB}=-F_{BA}$$_
- **Variable-acceleration time equation** (used to derive `v(t)`, `x(t)`, and `a(t)`)
$$a={dv\over dt}={F(v)\over m}\to \int_{v_0}^{v_t}{1\over F(v)}dv=\int_0^t{1\over m}dt\to v(t)=...$$
(Again, isolate the `v` inside `F(v)` as much as possible.)
$$trivially,\ a(t)={d\ v(t)\over dt};\ \ x(t)=\int_0^t v(t)\ dt$$

Use asymptotic equivalence or the leading term of the Taylor expansion to compare small quantities. Common approximations as `x→0` are:
- `sin x ~ x`, `tan x ~ x`, `arcsin x ~ x`
- `1 - cos x ~ x^2/2`
- `e^x - 1 ~ x`, `ln(1+x) ~ x`
- `√(1+x) - 1 ~ x/2`
- `a^x - 1 ~ x ln a` (`a>0`)

<br>

<br>

# PHY week3

<br>

### Stokes-model drag
The drag law for an ideal viscous fluid is (applicable only to low-speed motion in a highly viscous fluid):
$$f = kv$$
For example, using the “variable-acceleration time equation” (from week 2), one can derive the displacement, velocity, and acceleration of an iron ball falling through oil:
$$ma_y = mg - kv_y\ \to m \frac{dv_y}{dt} = mg - kv_y\ \to v_y(t) = v_t \big(1 - e^{-\tfrac{k}{m}t}\big)$$



<br>

### Pressure-difference drag model
For an ideal inertial fluid, the drag coefficient and drag force are modeled by
$$drag:\ D = \tfrac{1}{2} C \rho A,\ \ drag\ force:\ f = Dv^2\ \ equillibrium:\  \tfrac{1}{2} C \rho A v_t^2 - F_g = ma $$
- `C`: drag coefficient (dimensionless, depends on shape and flow regime)
- `ρ`: fluid density
- `A`: frontal area (cross-sectional area)
- `v`: relative flow speed (headwind / opposing flow adds positively)

For instance, the terminal speed of a raindrop of radius `R` in air satisfies
$$\tfrac{1}{2}C \rho_{air} \pi R^2 v_t^2 = {4\over3}\pi R^3 \rho_{water}g$$

<br>

- **Variable-acceleration velocity equation**: (used to derive `x(v)` and limiting displacement)

  (Suppose the object is subject to two forces `f` and `F`.)

  $$ma=m{dv\over dt}=f(x)+F(x)\to {dv\over dt}={f(x)+F(x)\over m},\ multiply\ by\ dx=vdt:$$
  $$\int dx=\int{mvdv\over f(x)+F(x)},\ then\ we\ have\ x(v)$$
