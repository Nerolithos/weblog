---
title: "⚛️ PHY1001 LEC10-15 Rotational Kinematics"
date: 2025-11-06T14:29:34+08:00
draft: false
summary: "Important takeaways from PHY1001 at CUHKSZ on rotational motion about an axis."
categories: 
- SSE
tags: 
- PHY1001
featured_image: "/images/phy2.jpg"
---



# Rotational Motion

</br>

## Basics

</br>

- Moment of inertia: $I=cMR^2$; for a point-mass-like object, $c=1$; for a disk/cylinder about its axis, $c=\tfrac12$; etc.
- Kinetic energy: $K=\tfrac12 Mv^2+\tfrac12 I_{\rm com}\,\omega^2$
- Torque: $\vec\tau=\vec r\times\vec F,\ \ \vec\tau_{\rm net}=\dfrac{d\vec L}{dt},\ \ \tau=F_{\rm net}\,r=I_{\rm axis}\,\alpha$; this measures the tendency of a force to rotate an object about an axis
- Angular momentum: $\vec L=\vec r\times\vec p,\ \ L=rp=rMv=I\omega$
  (Use the right-hand rule for all cross-product directions; $\vec r$ always points from the axis toward the edge.)
- For a rigid system with no external torque doing work, angular momentum is conserved: $\vec L_i=\vec L_f$
- Precession:
  - $\text{precession angle } d\phi=\dfrac{dL}{L}$
  - $\text{precession angular velocity }\ \omega=\frac{d\phi}{dt}=\frac{Mgr}{I\omega}$

- Rolling without slipping implies $s=\theta r$, i.e. the displacement of the center of mass equals the arc length rolled out by the rim  
  - At the center of mass, $v=v_{\rm COM}+\boldsymbol\omega\times\mathbf r=0$, hence $v_{\rm COM}=\omega r$  
  - If the contact point $p$ is taken as the instantaneous axis of rotation, then $v_p=\boldsymbol\omega\times\mathbf r$ and $a_{\rm COM}=\alpha R$

</br>

</br>

## Rolling/Sliding Problems: Two Cases

</br>

**Driven wheel**: the angular acceleration is supplied by the “engine,” and static friction points in the direction of motion, providing translational acceleration.  
$F_{\rm NET}=f_s=m a_{\rm COM}\le \mu_s N$ (when there is no slipping)  
$\tau=\tau_{\rm applied}-f_s R$  
$a_{\rm COM}=\alpha R$  
Solving gives:
$$a_C=\dfrac{\tau_{\rm eng}R}{I+mR^2},\qquad
f_s=ma_C=\dfrac{m\,\tau_{\rm eng}R}{I+mR^2}.$$

- For example, if a spinning ball is thrown onto a perfectly smooth plane with no friction, it will simply spin in place rather than translate.  
- For an unpowered wheel rolling uphill, friction points opposite to the downhill component of gravity, i.e. in the forward direction, and performs positive rotational work.  
  Therefore, for the same wheel on the same slope, because $K=\tfrac12 M v_{\rm com}^2+\tfrac12 I_{\rm COM}\omega^2=\Delta W$, the wheel subject to friction
  can reach a higher position.

</br>

**Passive wheel**: static friction points opposite to the applied pulling direction and is responsible for causing rotation.  
$F_{\rm NET}=F_{\rm applied}-f_s=m a_{\rm COM}$  
$\tau=f_s R\le \mu_s N R$ (when there is no slipping)  
$a_{\rm COM}=\alpha R$  
Solving gives:
$$a_C=\dfrac{F}{m+I/R^2},\qquad
f_s=\dfrac{I}{R^2}a_C=\dfrac{F I}{I+mR^2}$$

</br>

### Example 1: A rolling object of radius $R$ is pulled by a force $F$ applied at distance $d$ from the center, and experiences $f_s$. Assume no slipping.

If we assume friction points backward, then the net force is $F_{\rm NET}=F_{\rm applied}-f_s=m a_{\rm COM}$.

1. From the center-of-mass viewpoint:  
   Translation: $F-f_s=m a_{\rm COM}$  
   Rotation: $\tau=F d-f_s R=I\alpha$  
   Constraint: $a_{\rm COM}=\alpha R$

2. From the instantaneous rotation-axis viewpoint:  
   Translation: none  
   Rotation: $\tau_F=F(d+R)=I_P\,\alpha=(I+MR^2)\alpha$  
   Constraint: $a_{\rm COM}=\alpha R$  
   **Friction can be ignored directly**, because its lever arm is 0.

Which direction does friction point? Its direction may change because the no-slip constraint determines it; a larger torque demand can reverse the friction direction relative to the motion.

</br>

### Example 2: A spinning ball with angular velocity $\omega_0$ is thrown onto a table and experiences kinetic friction $f_k$ in the direction of motion

$v_{\rm COM}(t)=0+a_{\rm COM} t=\mu_k g\,t$  
$\omega(t)=\omega_0-\alpha t$

- When sliding stops: $v_{\rm COM}(t')=\omega(t')R$, $a_{\rm COM}=\alpha R$, and $f_k=0$
- Mechanical energy is not conserved; part of the work done by $f_k$ is converted into internal energy

One can derive the time required until sliding stops:
$$
\boxed{\ t=\frac{\big|v_0-\omega_0 R\big|}
{\mu_k g\left(1+\dfrac{MR^2}{I}\right)}
=\frac{M\big|v_0-\omega_0 R\big|}
{f_k\left(1+\dfrac{MR^2}{I}\right)}\ }
$$
This is the general formula for the time needed to reach pure rolling when friction is the only external horizontal force.

Usually the initial linear speed is ignored, i.e. $v_0=0\Rightarrow$ the linear speed and angular speed at the onset of pure rolling are:
$$v =\frac{I}{I+MR^2}\omega_0 R ;\ \  \omega =\frac{I}{I+MR^2}\omega_0$$  
Energy loss (converted into internal energy): $\displaystyle \Delta K=-\tfrac12\frac{IMR^2}{I+MR^2}\omega_0^2$

</br>

</br>

## Force- and Torque-Balance Problems

When solving for the location of the center, the magnitude of a force, or situations involving variable forces, it is often convenient to use force balance and torque balance:
$$
F_{\rm net,\ COM}=0;\ \ \tau_{\rm net}=0
$$
By choosing a special point as the axis for taking torques (typically the contact point or the center of mass), one can make the torque of some troublesome forces vanish.
