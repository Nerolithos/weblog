---
title: "💻 CSC1003 Assignment 1 OJ Practice"
date: 2024-09-22T15:49:58+08:00
draft: false
summary: "The first OJ programming practice for the first-year CUHKSZ course CSC1003."
categories: 
- SDS
tags: 
- CSC1003
- Exercises
featured_image: "/images/oj1.jpg"
---



The CSC1003 practice site at the SDS School of CUHKSZ:
[OJ main site](https://oj.cuhk.edu.cn/p/)

[OJ 2024](https://oj.cuhk.edu.cn/d/csc1003_2024_fall/p/)

[OJ former intranet address](http://10.26.200.13/)



#### Preface

- The following programs all passed the OJ system (as of September 2024) and are provided only for reference.

- As of September 2024, the OJ system could not reliably use keyboard input through the `main` method arguments alone; one had to rely on the `Scanner` class.
- As of September 2024, the OJ system required the class name to be exactly `Main`.
- Like this blog, the OJ website seems to upload content in a Markdown-like form, host it through Cloudflare, and then convert it to HTML, which **may lead to odd issues**. For example, content revisions may sometimes break the page.
- The OJ system judges both answers and broad program structure. In some fixed-answer problems, simply printing the answer may even be incorrectly accepted.



# OJ Practice



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
Note:
- `import java.util.*;` imports all classes in the `util` package, including `Scanner`, `Date`, `Random`, `Collections`, and others.




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
Alternative solutions:
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
Note:
- The JDK does not understand chained inequalities such as `99 < x < 1000`; this must instead be written as **`x > 99 && x < 1000`**.
- In Java, `/` denotes integer division on integers, and `%` is remainder. For example, in `int d = (x / 10) % 10;`, if the original three-digit number is 345, then `345 / 10 = 34` and `34 % 10 = 4`, which extracts the tens digit.
- **`println()` outputs and then moves to a new line; `print()` only outputs.**
- Why can we not use `print(x + ' ')`? In Java, **single quotes denote a character (`char`) while double quotes denote a string**. When an `int` is added to a `char`, the `char` is converted to its ASCII value, so the result becomes numerically incorrect. converted to its ASCII value, so the space character contributes 32 and the numeric output becomes incorrect.值多了 32。对于 153，实际上打印了 185（因为 153 + 32 = 185），再对应到 ASCII 值时，它正好显示为百分号 %。**与 ASCII 码无关时，请避免使用单引号。**




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
Note:

- **Do not accidentally omit the braces before `else` in an `if { } else { }` structure.**
- `main(String[] args)` receives values such as the `42` in `java Main 42`, while `Scanner` reads data typed after the program has already started.
- Unlike Python, Java’s Boolean literals are written in **lowercase**.




#### P1006  Pascal's_Triangle
```java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        // create an n*n two-dimensional array to store the Pascal triangle
        int[][] pascal = new int[n][n];
        // generate the Pascal triangle
        for (int i = 0; i < n; i++) {
            for (int j = 0; j <= i; j++) {
                // the first and last elements of each row are 1
                if (j == 0 || j == i) {
                    pascal[i][j] = 1;
                } else {
                    // each middle element equals the sum of the two adjacent elements in the previous row
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
Note:

- Two-dimensional arrays
  For the array `int[][] array = new int[2][4];`, this is an array with 2 rows and 4 columns:
  
  ```
    →列
  ↓  [][][][]
  行 [][][][]
  ```

- Then `array[1][3] = 2;` means:

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
Note:

- The length of an array must be defined.
- **`n++` returns the old value and then assigns `n+1` to `n`; `++n` increments first and then returns the new value.** Thus in a loop like `for (;; n++)`, if `break` occurs, the final value of `n` may end up one past the largest valid index, so reverse output should start from `n-1`.
- `int[] arr = new int[x]` means the length of `arr` is `x`, so the largest valid index is `x-1`; reverse traversal should therefore begin at `x-1`.




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
- In `public static int Divisor()`, the `int` specifies the return type. It plays the same role that `void` would in a method with no return value. The return value is whatever the method outputs through `return` when it finishes.




#### P1009  Prime_Counter
```java
import java.util.*;

public class Main {
    public static boolean isPrime(int num) {
        if (num < 2) return false;
        for (int div = 2; div <= Math.sqrt(num); div++) {
            if (num % div == 0) return false;
        }
        return true;
    }
    public static void main(String[] args) {
        int[] prime = new int[1000000];
        int count = 0;
        for (int x = 2; x < 1000000; x++) {
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

- If one is willing to sacrifice speed in order to save memory and reduce code length, one may skip building a prime table and compute primality dynamically in real time:

```java
import java.util.*;
public class Main {
    public static boolean isPrime(int num) {
        if (num < 2) return false;
        for (int div = 2; div * div <= num; div++) {
            if (num % div == 0) return false;
        }
        return true;
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int roof = sc.nextInt();
        if (roof < 2) {
            System.out.println(0);
            return;
        }
        int count = 0;
        for (int i = 2; i <= roof; i++) {
            if (isPrime(i)) count++;
        }
        System.out.println(count);
    }
}
```

- When a method’s **return type is Boolean**, **the method call itself can be used directly as the condition** of an `if` statement or a loop.
- Using scientific notation in `int[] prime = new int[1e7]` causes an error because `1e7` is treated as a `double`, leading to “incompatible types: possible lossy conversion from double to int.”



#### P1010 Split

```java
import java.util.Scanner;

public class Split {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        String input = scanner.nextLine();
        String[] numbers = input.split("\\+");
        
        int sum = 0;
        for (String number : numbers) {
            sum += Integer.parseInt(number.trim());
        }
        
        System.out.println(sum);
        
        scanner.close();
    }
}
```
- `a.trim()` removes leading and trailing whitespace from string `a`, such as spaces, tabs, and newlines.



#### P1011 ReadFloat

```java
import java.util.Scanner;

public class ReadFloat {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        double max = 0;
        double min = 0;
        double sum = 0;
        int count = 0;

        while (sc.hasNextDouble()) {
            double num = sc.nextDouble();
            if (num > max) max = num;
            if (num < min) min = num;
            sum += num;
            count++;
        }
        sc.close();

        double mean = sum / count;

        if (count > 0) {
            System.out.print(max+" ");
            System.out.printf("%.2f\n", mean);
        }
    }
}
```
- `while (scanner.hasNext()) {` checks whether another line / token of input still exists.
- `System.out.printf("%.2f\n", mean);`
  `printf`: formatting specifiers
  `%` marks the start of a specifier.
  `.2f` or `2d` indicates two digits of formatting precision.
  `\n` means newline.



#### P1012 Palindrome

```java
import java.util.Scanner;

public class Palindrome {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int num = sc.nextInt();
        int ori = num;
        sc.close();
        int[] digit = new int[10];
        int i = 0;
        while (num > 0) {
            digit[i] = num % 10;
            num /= 10; 
            i++;
        }
        int rev = 0;
        int p = 1;
        for (int n = i - 1; n >= 0; n--) { 
            rev += digit[n] * p;
            p *= 10;
        }
        if (rev == ori) {
            System.out.println("true");
        } else {
            System.out.println("false");
        }
    }
}
```







# Assignment 1



#### TestFibonacci

- Write code that reads a string in the form `"n, d"` and outputs the Fibonacci terms from `fib[n]` down to `fib[n-d+1]` (a total of `d` terms), joined by comma-space separators.

```java
import java.util.*;

public class Fibonacci {
    static Scanner input = new Scanner(System.in);
    // here is the function you need to implement
    public static void parse_line(int n, int d) {
        if (n < d) {
            System.out.println("invalid");
            return;
        }
        int[] a = new int[n];
        a[0]=1;
        a[1]=1;
        for (int i=2;i<n;i++) {
            a[i]=a[i-1]+a[i-2];
        }
        int i = 0;
        while (i<d) {
            System.out.print(a[n-i-1]);
            i++;
            if (i<d) {
                System.out.print(", ");           
            }
        }
        System.out.println();
    }

    public static void main(String[] args) throws Exception {
            String s = input.nextLine();
            input.close();
            String[] t = s.split(", ");
            int n = Integer.parseInt(t[0]);
            int d = Integer.parseInt(t[1]);
            if (t.length != 2) System.out.println("invalid");
            else Fibonacci.parse_line(n, d);
    }
}
```

- `System.out.println()` by itself simply prints a newline.
- `throw Exception` hands the error to exception-handling logic instead of silently resolving it. If there is no matching handling code and an error actually occurs, the program may terminate without the intended output.
- `throw Exception` can be paired with or handled by a `try-catch` structure:

```java
    public static void main(String[] args) {
        try {
            String s = input.nextLine();
            String[] t = s.split(", ");
            int n = Integer.parseInt(t[0]);
            int d = Integer.parseInt(t[1]);
            Fibonacci.parse_line(n, d);
        } catch (Exception e) {
            System.out.println("invalid");
        }
    }
```

- `Exception e` denotes a general caught exception object.





#### TestMathExpr

- Write a piece of code whose input has the form `"num1 sign num2"` for four arithmetic operations, for example `"3 / 2"`. Output the computed result, but if the input is invalid or the operation cannot be performed, output `"invalid"`.

```java
import java.util.*;

public class TestMathExpr {
    static Scanner input = new Scanner(System.in);
    // here is the function you need to implement
	public static void parse_line(String s1, String s2, String s3) {
        int n1 = Integer.parseInt(s1); int n2 = Integer.parseInt(s3);
        if (s2.equals("+")) System.out.println(n1 + n2);
        if (s2.equals("-")) System.out.println(n1 - n2);
        if (s2.equals("*")) System.out.println(n1 * n2);
        if (s2.equals("/")) {
            if (n2 == 0) {
                System.out.println("invalid");
            } else System.out.println(n1 / n2);
        }
    }

    public static void main(String[] args) throws Exception {
        String s = input.nextLine();
        input.close();
        String t[] = s.split(" ");
        if (t.length != 3) {
            System.out.println("invalid input");
        } else {
            TestMathExpr.parse_line(t[0], t[1], t[2]);
        }
    }
}
```

- In Java, `String` and `int` are incompatible types, so one cannot convert between them with a direct cast like `(int)`. If the string contains a valid integer, use `Integer.parseInt()` instead. **Casts only work among numeric types.**
- Using `s2 == "+"` inside an `if` statement is a classic Java mistake. In Java, `==` compares whether two objects have the same **reference**, not whether two strings have the same content. Use `.equals()` to compare string content.
