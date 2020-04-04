/**
 * 测试性质
 * 使用proxy实现响应式
 */

import { isObject } from "./utils";

let windowTarget: ((...args: any[]) => any) | null = null;

class Dep {
  private watchers: Set<any>;

  constructor() {
    this.watchers = new Set();
  }

  addWatch() {
    if (windowTarget) {
      console.log("收集依赖");
      this.watchers.add(windowTarget);
      return true;
    }
  }

  notify() {
    if (this.watchers.size > 0) {
      this.watchers.forEach(fn => {
        fn();
      });
      return true;
    }
  }
}

function observer(data: any) {
  if (!isObject(data)) return data;

  let proxy = defineReactive(data);

  const keys = Object.keys(data);
  for (let i = 0; i < keys.length; i++) {
    proxy[keys[i]] = observer(data[keys[i]]);
  }

  Object.defineProperty(data, "__obed__", { value: true });

  return proxy;
}

function defineReactive(obj: any): any {
  const map = new Map();

  function getDep(key: any) {
    return map.get(key) || map.set(key, new Dep()).get(key);
  }

  const proxy = new Proxy(obj, {
    get(target, key, receiver) {
      const dep = getDep(key);
      const bol = dep.addWatch(key);
      if (bol) console.log("　　　　", key);

      return Reflect.get(target, key, receiver);
    },

    set(target, key, val, receiver) {
      if (val.__obed__ === false) {
        val = observer(val);
      }
      const dep = getDep(key);
      const bol = dep.notify(key, val);
      if (bol) console.log("　　　　", key, val);

      return Reflect.set(target, key, val, receiver);
    },
  });

  return proxy;
}

const obj = { name: "wenye", hobby: ["history", "psychology"], info: { age: 22, city: "gz" } };
const proxy = observer(obj);

windowTarget = () => {
  console.log("触发依赖");
};
proxy.name;
proxy.hobby.forEach((i: any) => i);
windowTarget = null;

proxy.name = 1;

// proxy.age = 22;

proxy.hobby[0] = "yiye";

proxy.hobby.push({ name: "wenye" });

proxy.hobby.length = 0;
