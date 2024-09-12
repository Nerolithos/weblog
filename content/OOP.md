+++
title = '# 咖啡与OOP'
date = 2024-09-12T11:28:58+08:00
draft = false

featured_image = '/images/coffee.jpg'

+++



OOP(Object-Oriented Programming) 即面向对象编程。我们来了解 Java (不是指咖啡) 中的 OOP。它包括以下内容：

- **类(Class)**

- **对象(Object) ≈ 实例(Instance)**

- **封装(Encapsulation)**

- **继承(Inheritance)**

- **多态(Polymorphism)**

- **抽象(Abstraction)**



## 类，实例，对象

类 (class) 是**抽象**的概念，实例 (instance) 是**具体**的物体。如果说咖啡是一个类，那么Expresso、Frappe、美式、拿铁、卡布奇诺之类的都是这个类的实例。类是对象母版，**实例也可以叫做对象** (object)，实例都按照类的模版创造，但参数不同。

比如咖啡有浓缩咖啡占比、蒸奶占比、奶泡占比这三个参数：
```java
public Coffee(double expresso, double milk, double foam )
```

那么卡布奇诺与美式就是：
```java
public static void main(String[] args) {
    Coffee Cappuccino = new Coffee(1 / 3, 1 / 3, 1 / 3);
    Coffee Latte = new Coffee(0.2, 0.6, 0.2);
```
(以上代码段并不完整，仅供演示)



不难发现 new 关键字用于**创建类的新对象实例**。当你使用 new 时，Java 会在内存中分配空间来存储该对象，并调用类的构造方法来初始化对象。其通用语法为：
```java
ClassName objectName = new ClassName();
//类名(大写首字母) 实例名 = new 类名(传入的参数)
```

比如建立数组：
```java
int[] numbers = new int[5];  // 创建一个长度为5的int类型数组
System.out.println(numbers.length);  // 输出: 5
```
如此，numbers 被用于调用这个实例对象。

以下是一段完整的示例：
```java
public class Car {
    // 定义 Car 类的属性
    private String brand;
    private int year;
    private String model;
    private String color;

    // 构造方法，用于初始化 Car 对象
    public Car(String brand, int year, String model, String color) {
        this.brand = brand;
        this.year = year;
        this.model = model;
        this.color = color;
    }

    // 定义 Car 类的一个方法，用于显示汽车信息
    public void displayInfo() {
        System.out.println("This car is a " + year + " version of " + color + ", " + brand + " " + model + ".");
    }

    // 主方法，用于创建和操作 Car 类的实例，是程序的入口
    public static void main(String[] args) {
        // 创建 Car 类的一个实例
        Car myCar = new Car("Toyota", 1980, "Land_Cruiser", "Metallic_Red");
        // 调用实例的方法，显示实例的属性
        myCar.displayInfo();
    }
}
```

注意到程序中的第一个方法没有 `void`类型。因为在 Java 中，**构造方法(constructor)** 是一种特殊的方法，用于**初始化**对象的状态。构造方法的名称必须**与类名相同**。构造方法并不需要像普通方法那样返回一个值，因为它的作用是**建立对象本身**。
