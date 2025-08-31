+++
title = '☕️ 咖啡与OOP'
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



## 类，实例，对象，字段

**类** (class) 是**抽象**的概念，**实例** (instance) 是**具体**的物体。如果说咖啡是一个类，那么Expresso、Frappe、美式、拿铁、卡布奇诺之类的都是这个类的实例。类是对象母版，**实例也可以叫做对象** (object)，实例都按照类的模版创造，但**字段**(field)不同。(字段也称为成员变量)

比如咖啡有浓缩咖啡占比、蒸奶占比、奶泡占比这三个成员变量：
```java
public class Coffee {
    private double espresso;
    private double milk;
    private double foam;    //成员变量通常在类体内直接定义(方法之外)
  
    public Coffee(double espresso, double milk, double foam) {
        this.espresso = espresso;
        this.milk = milk;
        this.foam = foam;
    }
    //...
```

那么卡布奇诺与美式就是：
```java
    public static void main(String[] args) {
        Coffee cappuccino = new Coffee(1 / 3, 1 / 3, 1 / 3);
        Coffee latte = new Coffee(0.2, 0.6, 0.2);
    //...
```
(以上代码段并不完整，仅供演示)



不难发现 new 关键字用于**创建类的新对象实例**，这个过程叫做**实例化**。当你使用 new 时，Java 会在内存中分配空间来存储该对象，并调用类的**构造方法**来初始化对象。其通用语法为：
```java
ClassName objectName = new ClassName();
//类名(大写) 实例名(小写) = new 类名(传入的参数)
```

比如建立数组：
```java
int[] numbers = new int[5];  // 创建一个长度为5的int类型数组
System.out.println(numbers.length);  // 输出: 5
```
如此，numbers 被用于调用`int[5]`这个实例对象。



## 方法、构造方法、方法重载

以下是一段完整的示例：
```java
public class Coffee {
    // Private fields
    private double espresso;
    private double milk;
    private double foam; 

    // Constructor(构造方法)
    public Coffee(double espresso, double milk, double foam) {
        // 在构造函数中初始化 private 字段
        this.espresso = espresso;
        this.milk = milk;
        this.foam = foam;
    }

    // Getter 方法
    public double getEspresso() {
        return espresso;
    }

    public double getMilk() {
        return milk;
    }

    public double getFoam() {
        return foam;
    }

    // Main method
    public static void main(String[] args) {
        // 使用构造函数初始化 Coffee 对象
        Coffee cappuccino = new Coffee(1.0 / 3, 1.0 / 3, 1.0 / 3);
        System.out.println("Cappuccino - Espresso: " + cappuccino.getEspresso() + ", Milk: " + cappuccino.getMilk() + ", Foam: " + cappuccino.getFoam());
    }
}
```

- 注意到程序中的第一个方法不填写 `void`类型。因为在 Java 中，**构造方法(constructor)** 是一种特殊的方法，用于**初始化**对象的状态。构造方法的名称必须**与类名相同**。构造方法并不需要像普通方法那样返回一个值，因为它的作用是**建立对象本身**。
- 在 main 方法中调用了 `Coffee()` 构造方法，因为在类的定义中，**如果字段是 private 属性，那么只有类的内部(即只有构造方法、构造函数)才能直接访问或修改字段。**如果在类体中宣布字段是 public，那么理论上如下的修改也是可以的：

```java
public static void main(String[] args) {
        Coffee americano = new Coffee();
        americano.espresso = 1;
        americano.milk = -10;
        americano.foam = -100;
```

- **显然没有人能够在每喝完一份冰美式之后原地还给母牛 10 份牛奶，或者化身某种人力发泡机。**这就是为什么我们需要 private 属性来限制对初始化后的字段进行修改。(private 情况下，在 main 方法中如此定义在编译时会报错)

```java
public void setMilk(int age) {
        if (milk < 0 || milk > 1) {
            throw new IllegalArgumentException("invalid milk value");
        }
        this.milk = milk;
    }
```

- 如此，就可以防止输入值出现离谱的情况。这种方法叫做 setter，而外部代码要读取字段时要用 getter (上方主程序段已经演示了)。这样保证了类在定义时**封装(Encapsulation) **的严密性。
- 在字段定义时可以直接初始化值：

```java
public class Coffee {
    private double espresso = 1 / 3;
    private double milk = 1 / 3;
    private double foam = 1 / 3; 
```

- 然而由于构造方法 (在 main 方法中)的运行在字段定义之后，如果两者同时初始化字段值，字段值最终由构造方法决定。
- 没有定义构造方法时，编译器会自动创建一个默认的无参数构造方法。
- **方法重载**是指多个方法的方法名相同，但各自的参数不同，构造方法也可以重载。编译器根据参数自动判断调用的是哪个方法。
