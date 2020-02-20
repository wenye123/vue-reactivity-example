/**
 * 对象: 在getter中收集依赖 在setter中触发依赖
 * 数组: 在getter中收集依赖 在拦截器中触发依赖
 *
 * 与书中的不同支持
 * 1.dep采用set
 */

let windowTarget: any = undefined;

/** 解析对象访问字符串 */
const bailRe = /[^\w.$]/;
function parsePath(path: string) {
  if (bailRe.test(path)) return;
  const segments = path.split(".");
  return function(obj: Record<string, any>) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  };
}

/** 定义属性 */
function def(obj: any, key: string, val: any, enumerable: boolean = false) {
  Object.defineProperty(obj, key, {
    enumerable,
    writable: true,
    configurable: true,
    value: val,
  });
}

/** 定义拦截器 */
const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);
const hasProto = "__proto__" in {};
const arrayKeys = Object.getOwnPropertyNames(arrayMethods);
["push", "pop", "shift", "unshift", "splice", "sort", "reserve"].forEach((method: any) => {
  // 缓存原始方法
  const original = arrayProto[method];
  // 重新定义方法
  def(arrayMethods, method, function mutator(this: any, ...args: any[]) {
    // 执行原始方法
    const ret = original.apply(this, args);
    const ob = this.__ob__ as Observer;
    // 监听新增元素
    let inserted: any[] = [];
    switch (method) {
      case "push":
      case "unshift":
        inserted = args;
        break;
      case "splice":
        inserted = args.slice(2);
        break;
    }
    if (inserted.length > 0) ob.observeArray(inserted);
    // 触发依赖
    ob.dep.notify();
    return ret;
  });
});

/** 依赖收集类 */
class Dep {
  private subs: Set<Watcher>;
  constructor() {
    this.subs = new Set();
  }
  private addSub(sub: Watcher) {
    this.subs.add(sub);
  }
  // private removeSub(sub: Watcher) {
  //   this.subs.delete(sub);
  // }
  depend() {
    if (windowTarget) {
      this.addSub(windowTarget);
    }
  }
  notify() {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}

class Observer {
  // private value: any;
  /** 存储数组的依赖 */
  dep: Dep;
  constructor(value: any) {
    // this.value = value;
    this.dep = new Dep();
    def(value, "__ob__", this);
    if (Array.isArray(value)) {
      // 如果是数组，则用拦截器方法覆盖掉原生方法
      if (hasProto) {
        (value as any).__proto__ = arrayMethods;
      } else {
        for (let i = 0; i < arrayKeys.length; i++) {
          const key = arrayKeys[i];
          def(value, key, arrayMethods[key]);
        }
      }
      // 监听数组的每一项
      this.observeArray(value);
    } else {
      this.walk(value);
    }
  }
  /** 将对象每一个属性都响应化 */
  private walk(obj: Record<string, any>) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]]);
    }
  }
  /** 监听数组的每一项 */
  observeArray(arr: any[]) {
    for (let i = 0; i < arr.length; i++) {
      observe(arr[i]);
    }
  }
}

/** 为value创建一个Observer实例，如果已有则直接返回 */
function observe(value: any) {
  if (value === null || typeof value !== "object") return;
  let ob: Observer;
  if (Object.prototype.hasOwnProperty.call(value, "__ob__") && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}

/** 对象定义响应式 */
function defineReactive(data: any, key: string, val: any) {
  const childOb = observe(val);
  const dep = new Dep();
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      dep.depend();
      if (childOb) {
        childOb.dep.depend();
      }
      return val;
    },
    set(newVal: any) {
      if (val === newVal) return;
      val = newVal;
      dep.notify();
    },
  });
}

/** 依赖类 */
class Watcher {
  private vm: any;
  private getter: any;
  private cb: (n: any, o: any) => any;
  private value: any;
  constructor(vm: any, expOrFn: string, cb: (n: any, o: any) => any) {
    this.vm = vm;
    this.getter = parsePath(expOrFn); // 执行this.getter()就能得到诸如data.a.b的值
    this.cb = cb;
    this.value = this.get();
  }
  private get() {
    windowTarget = this;
    let value = this.getter.call(this.vm, this.vm);
    windowTarget = undefined;
    return value;
  }
  update() {
    const oldValue = this.value;
    this.value = this.get();
    this.cb.call(this.vm, this.value, oldValue);
  }
}

{
  const vm: any = {};

  defineReactive(vm, "name", "wenye");
  defineReactive(vm, "info", { name: "yiye", age: 22, arr: [1, { name: "erye" }] });

  // 单层对象
  new Watcher(vm, "name", (newVal: any, oldVal: any) => {
    console.log("watcher1", { newVal, oldVal });
  });
  // 修改响应值
  vm.name = "yiye";

  // 多层对象
  new Watcher(vm, "info.age", (newVal: any, oldVal: any) => {
    console.log("watcher2", { newVal, oldVal });
  });
  vm.info.age = 24;

  // 数组方法&数组新增元素
  new Watcher(vm, "info.arr", (newVal: any, oldVal: any) => {
    console.log("watcher3", { newVal, oldVal });
  });
  vm.info.arr.push({ name: "wenye" });
  new Watcher(vm, "info.arr.2.name", (newVal: any, oldVal: any) => {
    console.log("watcher4", { newVal, oldVal });
  });
  vm.info.arr[2].name = "yiye";

  // 数组内元素
  new Watcher(vm, "info.arr.1.name", (newVal: any, oldVal: any) => {
    console.log("watcher5", { newVal, oldVal });
  });
  vm.info.arr[1].name = "yiye";
}
