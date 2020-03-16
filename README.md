## vue响应式实现例子

[![Build Status](https://travis-ci.org/wenye123/vue-reactivity-example.svg?branch=master)](https://travis-ci.org/wenye123/vue-reactivity-example)
[![Coverage Status](https://coveralls.io/repos/github/wenye123/vue-reactivity-example/badge.svg?branch=master)](https://coveralls.io/github/wenye123/vue-reactivity-example?branch=master)

### 前言

> 最近发现一本好书《深入浅出vue.js》，看完后觉得很是惊叹，里面很详细的一步步介绍了vue的响应式原理，我也就跟着实现了一波，但是也不是完全和书中一样，些许是结合了源码（比如书中用Window.target我用的Dep.target）

### 正文

#### 响应式原理图片

![响应式](https://cdn.wenye123.com/20200315114754.jpg)

#### 计算属性

![计算属性](https://cdn.wenye123.com/20200315115801.jpg)

### 测试用例如下

![测试用例](https://cdn.wenye123.com/20200310182437.png)
