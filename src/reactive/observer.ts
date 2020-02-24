import { def, hasProto, hasOwn } from "./utils";
import { isObject } from "util";
import { Dep } from "./dep";

/** 定义拦截器 */
const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);
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

export class Observer {
  value: any;
  /** 存储数组的依赖 */
  dep: Dep;
  constructor(value: any) {
    this.value = value;
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
  if (!isObject(value)) return;
  let ob: Observer;
  if (hasOwn(value, "__ob__") && value.__ob__ instanceof Observer) {
    ob = value.__ob__;
  } else {
    ob = new Observer(value);
  }
  return ob;
}

/** 对象定义响应式 */
export function defineReactive(data: any, key: string, val: any) {
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
