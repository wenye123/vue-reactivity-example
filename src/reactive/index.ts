/**
 * 对象: 在getter中收集依赖 在setter中触发依赖
 * 数组: 在getter中收集依赖 在拦截器中触发依赖
 *
 */

import { Observer } from "./observer";
import { Watcher } from "./watcher";
import { IWatchCallback, IWatchOptions, IWatchExpOrFn } from "./types";
import { proxy } from "./utils";

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
    const watcher = new Watcher(this.$data, expOrFn, cb, options);
    // 立即执行
    if (options.immediate) {
      cb.call(this, watcher.value);
    }
    // 返回unwatch函数
    return function unWatchFn() {
      watcher.teardown();
    };
  }
}
