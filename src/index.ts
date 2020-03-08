/**
 * 对象: 在getter中收集依赖 在setter中触发依赖
 * 数组: 在getter中收集依赖 在拦截器中触发依赖
 *
 * bug: $set 子属性的监听也会触发 https://github.com/berwin/easy-to-understand-Vue.js-examples/issues/5
 * bug: 计算属性改变值执行多次计算属性的计算
 */

import { Observer, defineReactive } from "./reactive/observer";
import { Watcher } from "./reactive/watcher";
import { IWatchCallback, IWatchOptions, IWatchExpOrFn, IComputed, IComputedItem } from "./reactive/types";
import { proxy, isValidArrayIndex, hasOwn, noop } from "./reactive/utils";
import { Dep } from "./reactive/dep";

export interface IWueOption {
  data: any;
  computed?: any;
}

/** 这里的data对象并没有挂载到Wue实例中 */
export class Wue {
  $data: any;
  _Wue: boolean;
  _computedWatchers: Record<string, Watcher> = {};

  constructor(opt: IWueOption) {
    this._Wue = true;
    // 将data对象响应式化
    this.$data = opt.data;
    new Observer(this.$data);
    // 代理属性
    for (let key of Object.keys(this.$data)) {
      if (key.indexOf("_") !== 0 && key.indexOf("$") !== 0) {
        proxy(this, "$data", key);
      }
    }
    // 初始化computed
    initComputed(this, opt.computed);
  }

  $watch(expOrFn: IWatchExpOrFn, cb: IWatchCallback, options: IWatchOptions = { immediate: false, deep: false }) {
    const watcher = new Watcher(this, expOrFn, cb, options);
    // 立即执行
    if (options.immediate) {
      cb.call(this, watcher.value);
    }
    // 返回unwatch函数
    return function unWatchFn() {
      watcher.teardown();
    };
  }

  $set(target: any, key: any, value: any) {
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

  $del(target: any, key: any) {
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
}

const computedWatcherOptions = { lazy: true };

/** 初始化计算属性 */
function initComputed(vm: Wue, computed: IComputed) {
  const watchers = (vm._computedWatchers = Object.create(null));
  for (const key in computed) {
    const userDef = computed[key];
    const getter = typeof userDef === "function" ? userDef : userDef.get;
    if (process.env.NODE_ENV !== "production" && !getter) {
      console.warn(`计算属性${key}缺少getter`, vm);
    }
    watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions);
    if (!(key in vm)) {
      defineComputed(vm, key, userDef);
    } else {
      console.warn(`计算属性${key}已在vm上定义过`);
    }
  }
}

/** 定义计算属性(在vm上定义) */
function defineComputed(target: Wue, key: string, userDef: IComputedItem) {
  const get =
    typeof userDef === "function" ? createComputedGetter(key) : userDef.get ? createComputedGetter(key) : noop;
  let set = typeof userDef === "function" ? noop : userDef.set || noop;
  if (process.env.NODE_ENV !== "production" && set === noop) {
    set = function() {
      console.warn(`计算属性${key}缺少setter`);
    };
  }
  Object.defineProperty(target, key, {
    enumerable: true,
    configurable: true,
    get: get as any,
    set,
  });
}

/** 计算属性getter的高阶函数 */
function createComputedGetter(key: string) {
  return function computedGetter(this: Wue) {
    const watcher = this._computedWatchers[key];
    if (watcher) {
      if (watcher.dirty) {
        watcher.evaluate();
      }
      if (Dep.target) {
        watcher.depend();
      }
      return watcher.value;
    }
  };
}
