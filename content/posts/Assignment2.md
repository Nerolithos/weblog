---
title: "# CSC1003 Assignment2 二维数组"
date: 2024-10-31T14:49:58+08:00
draft: false
categories: 
- SDS
tags: 
- CSC1003
- 练习
---



# 二维数组



### 例题一(easy)：

编写一段代码，定义 Rotate 类，输入两个 整形数据 r 和 c，以及一个 r 行 c 列的二维数组，输出这个数组向右旋转 90° 的结果。
比如：
```shell
输入：        输出：
3            0 1 2
4            0 0 0
2 0 2 4      5 3 2
1 0 3 0      9 0 4
0 0 5 9
```


参考答案：
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
				output[n][r-1-m] = input[m][n]; // 唯一难点
			}
		}
		return output;
	}
}
```

- 注意，需要在非入口方法中调用主方法中的变量，比如： `int[][] output = new int[c][r];`，但 c 和 r 不是方法的局部变量时。如果变量是键盘输入的，并需要交给非入口方法时，需要将其作为成员变量写在方法初始化中，比如： `public static void method(int[][] input, int c, int r)`。**main 方法在调用其它方法时无法继承其变量。**

- `b = a.trim()` 可以**去除字符串首尾的空白字符**(例如空格、制表符、换行符等)
  `a.split("")`  可以**以引号内的字符分开一串字符串**，产生一系列字符串。引号内的分隔符会自动被删去。
  **也可以没有分隔符**，比如以下代码可以把一个数字按数位拆分：
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

- 相似的有，`a.replaceAll(String before, String after)`  可以把一串字符串里面所有某个字符替换为另一个。



### 例题二(irritating)：

编写一段代码，输入两个整数 r, c 并输入一个 r x c 的二维数组，包含一些整数，寻找从左上角走到右下角经过数字和最小的路径，并把这个数组变成经过的位置为 1，反之为 0 的“地图”(只能向右或向下走)。
比如：
```shell
输入：             输出：
4                 Resulting Map:
4                 1 1 1 0
3 5 2 8           0 0 1 1
11 6 8 2          0 0 0 1
0 7 3 13          0 0 0 1
1 4 15 4
```


参考答案：
```java
import java.util.*;

public class Mapper {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int r = sc.nextInt();
        int c = sc.nextInt();
        int[][] chart = new int[r][c];
        
        for (int row = 0; row < r; row++) { // 读取数组
            for (int col = 0; col < c; col++) {
                chart[row][col] = sc.nextInt();
            }
        }
        sc.close();
        
        int[][] map = map(r, c, chart);
        System.out.println("Resulting Map:");
        for (int[] row : map) { // 输出数组
            for (int val : row) {
                System.out.print(val + " ");
            }
            System.out.println();
        }
    }

    public static int[][] map(int r, int c, int[][] chart) {
        int[][] dp = new int[r][c]; // 用于存储到达每个点的最小路径和
        int[][] path = new int[r][c]; // 用于存储路径图
        dp[0][0] = chart[0][0];
        
        // 填充第一行和第一列
        for (int i = 1; i < r; i++) {
            dp[i][0] = dp[i - 1][0] + chart[i][0];
        }
        for (int j = 1; j < c; j++) {
            dp[0][j] = dp[0][j - 1] + chart[0][j];
        }

        // 计算其他位置的最小路径和
        for (int i = 1; i < r; i++) {
            for (int j = 1; j < c; j++) {
                dp[i][j] = Math.min(dp[i - 1][j], dp[i][j - 1]) + chart[i][j];
            }
        }

        // 从右下角回溯到左上角，标记路径
        int x = r - 1, y = c - 1;
        path[x][y] = 1;
        
        while (x > 0 || y > 0) {
            if (x == 0) { // 最上一行，只能从左边来
                y--;
            } else if (y == 0) { // 最左一列，只能从上面来
                x--;
            } else if (dp[x - 1][y] < dp[x][y - 1]) { // 从上方来
                x--;
            } else { // 从左边来
                y--;
            }
            path[x][y] = 1;
        }
        return path;
    }
}
```

- 思路：动态规划。另外创建一个与原数组(a)行列数相等的数组(b)，把走到原数组每个点的最小经过值记在新数组的对应点上。这样寻找最小走法只需要逐步回溯即可。每次找到最小路径就记录在另一个行列数相等的数组(c)上，最后输出数组(c)。
