---
title: "🧠 Brainstorming"
date: 2025-04-10T17:15:34+08:00
draft: false
summary: "From a stray thought in MAT2041 to the way interdisciplinary flashes of insight can lead to breakthroughs..."
categories: 
- SDS
---



# Brainstorming



This short note began with a moment of distraction during a MAT2041 lecture on April 3, 2025.



## How do we compute the determinant of an anti-triangular matrix?



![Preface](/images/b0.jpg)



Determinant computation: when two rows or two columns are swapped, the result is multiplied by -1.
In elementary sorting theory: if a line of people ordered from shortest to tallest is transformed into the reverse order, then under bubble sort the number of swaps is
$$rac{n(n-1)}{2}\ 	ext{(sorting factor)}$$
If we imagine vectors with many zeros in the column space of a matrix as “shorter people,” then the two problems are essentially equivalent. Since the determinant of a triangular matrix is the product of its diagonal entries, the determinant of an anti-triangular matrix is:
$$
(-1)^{rac{n(n-1)}{2}} \cdot\prod_{i=1}^na_{(i,\ n-i+1)}\ 	ext{(the product of the anti-diagonal entries)}
$$


![Computation process](/images/b1.jpg)





## The brachistochrone and an early prototype of calculus



A puzzle Galileo could not solve in his lifetime: among all possible paths from a higher point to a lower point, which one takes the least time?

Refraction of light: because of Fermat’s principle (the principle of least time), light travels at different speeds in different media. Before and after refraction at an interface, the ratio of the sines of the angles with the normal equals the ratio of the speeds before and after refraction. This allows light to move between two points in different media in the least possible time—this is the time-optimal path for light:
$$
{\sin(	heta_1)\over \sin(	heta_2)}={v_1\over v_2}\ 	ext{(Snell's law)}
$$

Bernoulli realized that the change in the speed of light at an interface is discrete, whereas the motion of a macroscopic object is continuous. If light were to pass through layer after layer of different media, with the speed decreasing gradually as it moved downward, then as the number of media tends to infinity, the broken path of light would converge to a smooth curve. That limiting curve is the brachistochrone.

This is one of the earliest conceptual prototypes of calculus.
![Infinitesimal derivation of the refracted light path](/images/b2.jpg)





## Conclusion



There is no need to fear “wild imagination.” Thinking is not a waste of time; in fact, refusing to think is what leads to shallow, complacent understanding.
