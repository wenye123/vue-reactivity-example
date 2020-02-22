/**
 * 对象: 在getter中收集依赖 在setter中触发依赖
 * 数组: 在getter中收集依赖 在拦截器中触发依赖
 *
 * 与书中的不同支持
 * 1.dep采用set
 */

import { Observer } from "./observer";
import { Watcher } from "./watcher";

/** 这里的data对象并没有挂载到Wue实例中 */
export class Wue {
  data: any;

  constructor(data: any) {
    this.data = data;
    new Observer(this.data);
  }

  watch(expOrFn: string, cb: (n: any, o: any) => any) {
    new Watcher(this.data, expOrFn, cb);
  }
}
