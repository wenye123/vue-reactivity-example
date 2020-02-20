/**
 * 与书中的不同支持
 * 1.dep采用set
 * 2.判断对象采用Object.prototype.toString.call(val) === "[object Object]"
 */

let windowTarget: any = undefined;

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
  constructor(value: any) {
    // this.value = value;
    if (!Array.isArray(value)) {
      this.walk(value);
    }
  }
  /** 将对象每一个属性都响应化 */
  walk(obj: Record<string, any>) {
    const keys = Object.keys(obj);
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]]);
    }
  }
}

function defineReactive(data: any, key: string, val: any) {
  // 递归子属性
  if (Object.prototype.toString.call(val) === "[object Object]") {
    new Observer(val);
  }
  const dep = new Dep();
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      dep.depend();
      return val;
    },
    set(newVal: any) {
      if (val === newVal) return;
      val = newVal;
      dep.notify();
    },
  });
}

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
  defineReactive(vm, "info", { name: "yiye", age: 22 });

  new Watcher(vm, "name", (newVal: any, oldVal: any) => {
    console.log("watcher1", { newVal, oldVal });
  });
  // 修改响应值
  vm.name = "yiye";

  new Watcher(vm, "info.age", (newVal: any, oldVal: any) => {
    console.log("watcher2", { newVal, oldVal });
  });
  vm.info.age = 24;
  vm.info = { name: "erye", age: 25 };
}
