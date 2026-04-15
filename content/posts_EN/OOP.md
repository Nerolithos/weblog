+++
title = '☕️ Coffee and OOP'
date = 2024-09-12T11:28:58+08:00
draft = false

featured_image = '/images/coffee.jpg'

+++



OOP (Object-Oriented Programming) is the programming paradigm built around objects. Let us use Java OOP—rather than coffee—as an example. It includes the following core ideas:

- **Class**

- **Object ≈ Instance**

- **Encapsulation**

- **Inheritance**

- **Polymorphism**

- **Abstraction**



## Classes, instances, objects, and fields

A **class** is an **abstract** concept, whereas an **instance** is a **concrete** entity. If coffee is treated as a class, then espresso, frappe, Americano, latte, and cappuccino are instances of that class. A class is the template from which objects are created, and an **instance can also be called an object**. Objects are created according to the class template, but they may differ in their **fields** (also called member variables).

For example, suppose a coffee object is described by three member variables: the proportion of espresso, steamed milk, and milk foam:
```java
public class Coffee {
    private double espresso;
    private double milk;
    private double foam;    // Member variables are usually defined directly inside the class body (outside methods)
  
    public Coffee(double espresso, double milk, double foam) {
        this.espresso = espresso;
        this.milk = milk;
        this.foam = foam;
    }
    //...
```

Then a cappuccino and a latte may be created as follows:
```java
    public static void main(String[] args) {
        Coffee cappuccino = new Coffee(1 / 3, 1 / 3, 1 / 3);
        Coffee latte = new Coffee(0.2, 0.6, 0.2);
    //...
```
(The code above is incomplete and is intended only as a demonstration.)



It is not hard to see that the keyword `new` is used to **create a new instance of a class**. This process is called **instantiation**. When you use `new`, Java allocates memory for the object and then calls the class's **constructor** to initialize it. The general syntax is:
```java
ClassName objectName = new ClassName();
// Class name (capitalized) instance name (lowercase) = new class name (with arguments)
```

For example, when creating an array:
```java
int[] numbers = new int[5];  // Create an int array of length 5
System.out.println(numbers.length);  // Output: 5
```
In this sense, `numbers` is used to refer to the instance object `int[5]`.



## Methods, constructors, and method overloading

Below is a complete example:
```java
public class Coffee {
    // Private fields
    private double espresso;
    private double milk;
    private double foam; 

    // Constructor
    public Coffee(double espresso, double milk, double foam) {
        // Initialize the private fields inside the constructor
        this.espresso = espresso;
        this.milk = milk;
        this.foam = foam;
    }

    // Getter methods
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
        // Initialize a Coffee object with the constructor
        Coffee cappuccino = new Coffee(1.0 / 3, 1.0 / 3, 1.0 / 3);
        System.out.println("Cappuccino - Espresso: " + cappuccino.getEspresso() + ", Milk: " + cappuccino.getMilk() + ", Foam: " + cappuccino.getFoam());
    }
}
```

- Notice that the first method in the program does not specify a `void` return type. In Java, a **constructor** is a special method used to **initialize** the state of an object. Its name must be **the same as the class name**. A constructor does not need to return a value like an ordinary method, because its purpose is to create the object itself.
- In the `main` method, we call the `Coffee()` constructor. This matters because, if a field is declared `private`, then only code inside the class (for example, the constructor or other class methods) can directly access or modify it. If we declared the fields as `public`, then in principle code like the following would also be legal:

```java
public static void main(String[] args) {
        Coffee americano = new Coffee();
        americano.espresso = 1;
        americano.milk = -10;
        americano.foam = -100;
```

- **Clearly, no one can drink one iced Americano and then somehow return 10 portions of milk to the cow, nor transform into a human foam machine.** This is why we use `private` fields: they restrict arbitrary modification after initialization. (If the fields are `private`, defining them this way inside `main` will produce a compile-time error.)

```java
public void setMilk(int age) {
        if (milk < 0 || milk > 1) {
            throw new IllegalArgumentException("invalid milk value");
        }
        this.milk = milk;
    }
```

- In this way, absurd input values can be ruled out. Such a method is called a **setter**, while external code reads fields through a **getter** (already demonstrated in the main program above). This is how **encapsulation** is enforced in the definition of a class.
- Fields may also be initialized directly where they are declared:

```java
public class Coffee {
    private double espresso = 1 / 3;
    private double milk = 1 / 3;
    private double foam = 1 / 3; 
```

- However, because the constructor runs after field declarations, if both initialize the same fields, the final values are determined by the constructor.
- If no constructor is explicitly defined, the compiler automatically creates a default no-argument constructor.
- **Method overloading** means that multiple methods share the same name but have different parameter lists. Constructors can also be overloaded. The compiler determines which version is being called based on the arguments.
