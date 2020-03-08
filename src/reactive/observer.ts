import { def, hasProto, hasOwn, isValidArrayIndex } from "./utils";
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

/** 响应观察对象生成类 */
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

/** 新增响应属性 */
export function set(target: any, key: any, value: any) {
  // 数组
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key);
    target.splice(key, 1, value);
    return value;
  }
  // key已经存在
  if (hasOwn(target, key)) {
    target[key] = value;
    return value;
  }
  // 处理新增属性
  const ob = target.__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== "production" && console.warn("target不能是vue实例或者vue实例的根数据对象");
    return value;
  }
  if (!ob) {
    target[key] = value;
    return value;
  }
  defineReactive(ob.value, key, value);
  ob.dep.notify();
  return value;
}

/** 删除响应属性 */
export function del(target: any, key: any) {
  // 数组
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1);
    return;
  }
  // 删除属性
  const ob = target.__ob__;
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== "production" && console.warn("删除属性不能在vue实例或者vue实例的根数据对象上");
    return;
  }
  // 不是自身属性
  if (!hasOwn(target, key)) return;
  delete target[key];
  // ob不存在则不通知
  if (!ob) return;
  ob.dep.notify();
}
