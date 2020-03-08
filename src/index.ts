/**
 * 对象: 在getter中收集依赖 在setter中触发依赖
 * 数组: 在getter中收集依赖 在拦截器中触发依赖
 *
 * bug: $set 子属性的监听也会触发 https://github.com/berwin/easy-to-understand-Vue.js-examples/issues/5
 */

import { Observer, defineReactive } from "./reactive/observer";
import { Watcher } from "./reactive/watcher";
import { IWatchCallback, IWatchOptions, IWatchExpOrFn } from "./reactive/types";
import { proxy, isValidArrayIndex, hasOwn } from "./reactive/utils";

/** 这里的data对象并没有挂载到Wue实例中 */
export class Wue {
  $data: any;

  constructor(data: any) {
    this.$data = data;
    new Observer(this.$data);
    // 代理属性
    for (let key of Object.keys(this.$data)) {
      if (key.indexOf("_") !== 0 && key.indexOf("$") !== 0) {
        proxy(this, "$data", key);
      }
    }
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
