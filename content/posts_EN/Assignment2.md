---
title: "💻 CSC1003 Assignment 2: Two-Dimensional Arrays"
date: 2024-10-31T14:49:58+08:00
draft: false
summary: "Worked examples for the second CSC1003-Java assignment."
categories: 
- SDS
tags: 
- CSC1003
- Exercises
---



# Two-Dimensional Arrays



### Example 1 (easy):

Write a program that defines a class `Rotate`, reads two integers `r` and `c`, then reads an `r × c` two-dimensional array, and outputs the result of rotating the array 90° clockwise.
For example:
```shell
Input:        Output:
3            0 1 2
4            0 0 0
2 0 2 4      5 3 2
1 0 3 0      9 0 4
0 0 5 9
```


Reference solution:
```java
import java.util.*;

public class Rotate {

	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		int r = sc.nextInt(); int c = sc.nextInt(); sc.nextLine();
		int[][] input = new int[r][c];
		int rcount = 0;
		while (sc.hasNextLine() && rcount < r) {
			String temp = sc.nextLine();
			String[] values = temp.split(" ");
			for (int i = 0; i < c; i++) {
				input[rcount][i] = Integer.parseInt(values[i]);
			}
			++rcount;
		}
		sc.close();
		int[][] output = rotate(input, c, r);

        for (int i = 0; i < c; i++) {
            for (int j = 0; j < r; j++) {
                System.out.print(output[i][j] + " ");
            }
            System.out.println();
        }
	}

	public static int[][] rotate(int[][] input, int c, int r) {
		int[][] output = new int[c][r];
		for (int m = r-1; m>-1; m--) {
			for (int n = 0; n<c; n++) {
				output[n][r-1-m] = input[m][n]; // the only real tricky step
			}
		}
		return output;
	}
}
```

- Note that when a non-entry method needs to use variables from `main`, those variables must be passed in explicitly. For instance, in `int[][] output = new int[c][r];`, if `c` and `r` are not local to the method, and they originate from user input, then they must be included as parameters, such as `public static void method(int[][] input, int c, int r)`. **A method called by `main` cannot automatically inherit local variables from `main`.**

- `b = a.trim()` can **remove leading and trailing whitespace** from a string (for example, spaces, tabs, and line breaks).  
  `a.split("")` can **split a string using the character or pattern inside the quotes**, producing a sequence of substrings. The separator itself is removed automatically.
  **It may also be used without a visible separator in certain introductory examples**. For example, the following code splits a number into its individual digits:
```java
public class Split {
    public static void main(String[] args) {
        String str = "12321";
        String[] d = str.split("");
        int[] digit = new int[d.length];
        for (int i = 0; i < d.length; i++) {
            digit[i] = Integer.parseInt(d[i]);
        }
    }
}
```

- Similarly, `a.replaceAll(String before, String after)` can replace every occurrence of one substring in a string with another.



### Example 2 (irritating):

Write a program that reads two integers `r` and `c`, then reads an `r × c` array containing integers. Your task is to find a path from the upper-left corner to the lower-right corner such that the sum of the numbers on the path is minimized, and then convert the array into a binary “map” where positions on the chosen path are marked `1` and all other positions are marked `0`. (You may only move **right** or **down**.)
For example:
```shell
Input:             Output:
4                 Resulting Map:
4                 1 1 1 0
3 5 2 8           0 0 1 1
11 6 8 2          0 0 0 1
0 7 3 13          0 0 0 1
1 4 15 4
```


Reference solution:
```java
import java.util.*;

public class Mapper {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int r = sc.nextInt();
        int c = sc.nextInt();
        int[][] chart = new int[r][c];

        for (int row = 0; row < r; row++) { // read the array
            for (int col = 0; col < c; col++) {
                chart[row][col] = sc.nextInt();
            }
        }
        sc.close();

        int[][] map = map(r, c, chart);
        System.out.println("Resulting Map:");
        for (int[] row : map) { // output the array
            for (int val : row) {
                System.out.print(val + " ");
            }
            System.out.println();
        }
    }

    public static int[][] map(int r, int c, int[][] chart) {
        int[][] dp = new int[r][c]; // stores the minimum path sum to each cell
        int[][] path = new int[r][c]; // stores the reconstructed path
        dp[0][0] = chart[0][0];

        // fill the first row and the first column
        for (int i = 1; i < r; i++) {
            dp[i][0] = dp[i - 1][0] + chart[i][0];
        }
        for (int j = 1; j < c; j++) {
            dp[0][j] = dp[0][j - 1] + chart[0][j];
        }

        // compute the minimum path sums for the remaining cells
        for (int i = 1; i < r; i++) {
            for (int j = 1; j < c; j++) {
                dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + chart[i][j];
            }
        }

        // backtrack from the lower-right corner to the upper-left corner and mark the path
        int x = r - 1, y = c - 1;
        path[x][y] = 1;

        while (x > 0 || y > 0) {
            if (x == 0) { // top row: can only come from the left
                y--;
            } else if (y == 0) { // leftmost column: can only come from above
                x--;
            } else if (dp[x - 1][y] < dp[x][y - 1]) { // came from above
                x--;
            } else { // came from the left
                y--;
            }
            path[x][y] = 1;
        }
        return path;
    }
}
```

- Idea: use dynamic programming. Create another array `b` with the same dimensions as the original array `a`, and store in `b` the minimum path sum required to reach each position in `a`. Then, to recover the minimum-cost route, you only need to backtrack step by step. Each selected position is recorded in yet another array `c` of the same dimensions, and finally array `c` is printed as the output map.
