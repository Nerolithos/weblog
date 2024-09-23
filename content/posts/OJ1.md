---
title: "# CSC1003 Practice2 OJ习题"
date: 2024-09-22T15:49:58+08:00
draft: false
categories: 
- SDS
tags: 
- CSC1003
- 练习
featured_image: "/images/oj1.jpg"
---



龙大 SDS 学院 CSC1003 的 Practice 网站：
[OJ 主站](https://oj.cuhk.edu.cn/p/)
[OJ 2024](https://oj.cuhk.edu.cn/d/csc1003_2024_fall/p/)



#### 前言

- 以下程序均通过了 OJ 系统(截止到 2024 年 9 月)的批改，仅供参考。

- OJ 系统截止到 2024 年 9 月都无法使用 main 方法的键盘录入功能，只能依靠 Scanner 类。
- OJ 系统截止到 2024 年 9 月必须使用 `Main` 作为类名。
- OJ 系统和本博客一样，其网页似乎是用 Markdown 格式上传，由 Cloudflare 托管，再转成 HTML 的，**这可能导致一些问题**。比如编写者对网站内容进行修改和增补时，**可能导致网站崩溃**。
- OJ 系统检测的是答案和程序结构，如果在大致框架上差不多，然后直接 print 答案的话(比如在 P1004中，答案是固定的) 系统可能误判为程序正确。



#### P1001  A+BProblem
```java
import java.util.Scanner;

public class Main {
  public static void main(String[] args) {
    Scanner sc = new Scanner(System.in);
    int x = sc.nextInt();
    int y = sc.nextInt();
    System.out.println(x + y);
    }
}
```
注意：
- `import java.util.*;` 可以导入 util package 下的所有类，包括 Scanner, Date, Random, Collections 等。




#### P1004  Narcissistic_numbers
```java
public class Main {
	public static void main(String[] args) {
		for (int x = 100; x < 1000; x++) {
			int h = x / 100;
			int d = (x - h * 100) / 10;
			int u = x - h * 100 - d * 10;
			int p = h * h * h + d * d * d + u * u * u;
			if (p == x) {
				System.out.print(x + " ");
			}
		}
	}
}
```
其他解法：
```java
public class Main {
    public static void main(String[] args) {
        for (int x = 100; x < 1000; x++) {
            int h = x / 100;
            int d = (x / 10) % 10;
            int u = x % 10;
            int p = (int)(Math.pow(h, 3) + Math.pow(d, 3) + Math.pow(u, 3));
            if (p == x) {
                System.out.println(x + " ");
            }
        }
    }
}
```
注意：
- JDK 无法理解 `99 < x < 1000` 这种连不等式，**需要表达为`x > 99 && x < 1000`。**
- Java 中 `/` 是整除，`%` 是取余。以 `int d = (x / 10) % 10;` 为例，假设原三位数为 345，345 / 10 = 34，34 % 10 = 4，从而达到取十位数的作用。
- **`println()` 输出后换行；`print()` 只输出。**
- 为什么不能用 `print(x + ' ')` ? 在 Java 中，**单引号内的数据是字符(char)而双引号内是字符串(string)**，当你使用 + 运算符连接 int 类型和 char 类型时，**char 会转换为其对应的 ASCII 值参与加法运算**。因此，空格字符的 ASCII 值是 32，导致输出的结果是 x + 32，这会得到错误的数字输出。因此看到的数字的结果比预期的值多了 32。对于 153，实际上打印了 185（因为 153 + 32 = 185），再对应到 ASCII 值时，它正好显示为百分号 %。**与 ASCII 码无关时，请避免使用单引号。**




#### P1005  Divisible
```java
import java.util.*;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		int x = sc.nextInt();
		int y = sc.nextInt();
		if (x % y == 0 || y % x == 0) {
			System.out.print("true");
		} else
			System.out.print("false");
	}
}
```
注意：

- **`if{}else{}` 结构千万不要漏 else 前面的大括号。**
- `main(String[] args)` 的键盘输入功能收集 `java Main 42` 中的 42(与运行命令同行)；Scanner 类的键盘输入功能收集 `java Main` 这一命令行运行后键入的数据。
- 与 Python 不同，Java 中的布尔值保留名是**小写**的。




#### P1006  Pascal's_Triangle
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // 创建一个二维n*n数组来存储帕斯卡三角形的值
        int[][] pascal = new int[n][n];
        // 生成帕斯卡三角形
        for (int i = 0; i < n; i++) {
            for (int j = 0; j <= i; j++) {
                // 每行的首尾元素为 1
                if (j == 0 || j == i) {
                    pascal[i][j] = 1;
                } else {
                    // 中间的元素等于上一行相邻的两个元素之和
                    pascal[i][j] = pascal[i - 1][j - 1] + pascal[i - 1][j];
                }
                System.out.print(pascal[i][j] + " ");
            }
            System.out.println();
        }
        sc.close();  // 用于释放内存，虽然去掉也能运行
    }
}
```
注意：

- 二维数组
  对于数组 `int[][] array = new int[2][4];` ，这是一个二行四列的数组：
  
  ```
    →列
  ↓  [][][][]
  行 [][][][]
  ```

- 那么 `array[1][3] = 2;` 表示:

  ```
  [][][][]
  [][][][2]
  ```

  


#### P1007  Reverse
```java
import java.util.*;

public class Main {
	public static void main(String[] args) {
		Scanner sc = new Scanner(System.in);
		int[] nums = new int[10000];
		int n = 0;
		for (;; n++) {
			if (sc.hasNextInt()) {
				nums[n] = sc.nextInt();
			} else {
				break;
			}
		}
		for (int m = n - 1; m >= 0; m --) {
			System.out.print(nums[m] + " ");
		}
	}
}
```
注意：

- 数组的长度必须要定义的。
- **`n++` 表示将 n+1 的值赋给 n 并调用 n；`++n` 表示先调用 n 再将 n+1 的值赋给 n**。所以在`for (;; n++)` 循环中 break(强制退出循环) 时 n 的值为 nums 数组长度+2，也就是最大序号+1。所以后面倒序将数组输出时需要从 n-1 项(也就是数组的最后一项)开始。




#### P1008 Divisor
```java
import java.util.*;

public class Main {
    public static int Divisor(int[] arr1, int len1, int[] arr2, int len2) {
        int max = 1;
        for (int m = 0; m < len1; m++) {
            for (int n = 0; n < len2; n++) {
                if (arr1[m] == arr2[n]) {
                    max = Math.max(max, arr1[m]);
                }
            }
        }
        return max;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int x = sc.nextInt();
        int y = sc.nextInt();
        int[] xd = new int[100];
        int[] yd = new int[100];
        int cx = 0;
        int cy = 0;
        for (int d = 1; d <= x; d++) {
            if (x % d == 0) {
                xd[cx] = d;
                cx++;
            }
        }
        for (int e = 1; e <= y; e++) {
            if (y % e == 0) {
                yd[cy] = e;
                cy++;
            }
        }
        int result = Divisor(xd, cx, yd, cy);
        System.out.println(result);
        sc.close();
    }
}
```
- `public static int Divisor()` 中的 `int` 表示返回值的类型，位置 `void` 对等。返回值就是这个方法运行结束时输出(return) 的值。




#### P1009  Prime_Counter
```java
import java.util.*;

public class Main {
    public static boolean isPrime(int num) {
        if (num < 2) {
            return false;
        }
        for (int div = 2; div <= Math.sqrt(num); div++) {
            if (num % div == 0) {
                return false;
            }
        }
        return true;
    }
    public static void main(String[] args) {
        int[] prime = new int[1e7];
        int count = 0;
        for (int x = 2; x < 1e7; x++) {
            if (isPrime(x)) {
                prime[count] = x;
                ++count;
            }
        }
        Scanner sc = new Scanner(System.in);
        int roof = sc.nextInt();
        for (int n = 0; n < count - 1; n++) {
            if (prime[n] <= roof && prime[n + 1] > roof) {
                System.out.println(n + 1);
                break;
            }
            if (roof == 1) {
            	  System.out.println(0);
            	  break;
            }
        }
    }
}
```

- 当方法的**返回值是布尔值类型**时，**这个方法本身可以作为判断/循环语句的条件部分**。