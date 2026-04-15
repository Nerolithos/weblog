+++
title = ' 🌐 IP Addresses and Subnet Masks'
date = 2024-09-11T09:26:58+08:00
draft = false

+++



On 2024-08-22, several students raised a few networking questions during CUHKSZ's course-selection training livestream (see the screenshot below). At that point the semester had not yet started, and `10.20.219.31` is obviously a private IP address, so it cannot be accessed directly from the public Internet. In other words, it can only be reached when the client is already inside the `10.0.0.0` network, namely CUHKSZ's subnet.

![](https://i.postimg.cc/FsKQ3wzM/截屏2026_01_11_18_05_02.png)



Globally, the following private IP address prefixes are commonly used in local area networks (LANs). These prefixes are defined by [RFC 1918](https://tools.ietf.org/html/rfc1918):
* **10.0.0.0/8** - Covers the range from 10.0.0.0 to 10.255.255.255. This is a very large address space and is usually used in large enterprise networks. (CUHKSZ is surprisingly using quite a large private network.)

* **172.16.0.0/12** - Covers the range from 172.16.0.0 to 172.31.255.255. This space is smaller and is common in medium-sized networks.

* **192.168.0.0/16** - Covers the range from 192.168.0.0 to 192.168.255.255. This is the most common address space used in home routers and small networks.
  These IP prefixes are private and **cannot be routed on the Internet**. They are meant primarily for internal network communication.

  

Now take my home router's LAN as an example. An “IP address” is private and **cannot be routed on the Internet**, so why is it sometimes called a “soft address”? Why do we still need a MAC address at all? The answer is obvious: the last few digits after `192.168` cannot be globally unique across the entire Internet. Within `192.168.0.0`, `192.168.0.0` is the network address and `192.168.255.255` is the broadcast address, so neither can serve as a host address. That means there are only `2^8 - 2 = 254` usable host addresses in such a subnet. Therefore, we also need a longer numerical identifier that is globally unique—namely, the MAC address.



A subnet mask helps a router determine whether a given network address belongs to one of its subnets. Consider a host IP such as `192.168.50.137`. Here, `192.168.50` is the network part and `.137` is the host part. Since my private network address is `192.168.50.0`, any address beginning with `192.168.50` belongs to the same subnet, and the host suffix can be abstracted away. This is where the subnet mask `255.255.255.0` becomes useful. In binary logic, `1 AND 1 = 1`, `1 AND 0 = 0`, and `0 AND 0 = 0`. When `255.255.255.0` is ANDed with an IP address, the mask `11111111.11111111.11111111.00000000` preserves the first three octets and forces the last octet to become `0`. As a result, after subnet-mask computation, all devices under this router map to `192.168.50.0`. This also explains why any device inside CUHKSZ's `10.0.0.0` network can route to `10.20.219.31`, whereas an external client cannot.
