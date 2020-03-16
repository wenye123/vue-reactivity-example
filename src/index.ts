/**
 * 对象: 在getter中收集依赖 在setter中触发依赖
 * 数组: 在getter中收集依赖 在拦截器中触发依赖
 */

import { Observer, set, del } from "./reactive/observer";
import { Watcher } from "./reactive/watcher";
import { proxy, noop } from "./reactive/utils";
import { Dep } from "./reactive/dep";
import { IWatchCallback, IWatchOptions, IWatchExpOrFn } from "./reactive/watcher";

export interface IWueOption {
  data: any;
  computed?: any;
}
export type IComputedItem = (() => any) | { get: () => any; set: (...args: any) => any };
export type IComputed = Record<string, IComputedItem>;

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

  $set = set;
  $del = del;
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
    // 创建计算属性的watcher
    watchers[key] = new Watcher(vm, getter || noop, noop, computedWatcherOptions);
    // vm上不存在则定义
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
