import { parsePath } from "./utils";
import { Dep, pushTarget, popTarget } from "./dep";
import { isObject } from "util";

export interface IWatchOptions {
  immediate?: boolean;
  deep?: boolean;
  lazy?: boolean;
}

export type IWatchCallback = (n: any, o?: any) => any;

export type IWatchExpOrFn = string | (() => any);

/** 遍历值deep watch */
const seenObj: Set<number> = new Set();
function traverse(val: any) {
  _traverse(val, seenObj);
  seenObj.clear();
}

function _traverse(val: any, seen: Set<number>) {
  if ((!Array.isArray(val) && !isObject(val)) || Object.isFrozen(val)) return;
  if (val.__ob__) {
    const depId: number = val.__ob__.dep.id;
    if (seen.has(depId)) return;
    seen.add(depId);
  }
  if (Array.isArray(val)) {
    for (let item of val) {
      _traverse(item, seen);
    }
  } else {
    for (let key of Object.keys(val)) {
      _traverse(val[key], seen);
    }
  }
}

/** 依赖类 */
export class Watcher {
  private vm: any;
  private deps: Dep[];
  private depIds: Set<number>;
  private getter: any;
  private cb: IWatchCallback;
  private deep: boolean;
  private lazy: boolean;
  dirty: boolean;
  value: any;

  constructor(
    vm: any,
    expOrFn: IWatchExpOrFn,
    cb: IWatchCallback,
    options: IWatchOptions = { immediate: false, deep: false, lazy: false },
  ) {
    this.vm = vm;
    this.deep = !!options.deep;
    this.lazy = !!options.lazy;
    this.dirty = this.lazy;
    this.deps = [];
    this.depIds = new Set();
    if (typeof expOrFn === "function") {
      this.getter = expOrFn;
    } else {
      this.getter = parsePath(expOrFn); // 执行this.getter()就能得到诸如data.a.b的值
    }
    this.cb = cb;
    this.value = this.lazy ? undefined : this.get();
  }

  private get() {
    pushTarget(this);
    const value = this.getter.call(this.vm, this.vm);
    if (this.deep) {
      traverse(value);
    }
    popTarget();
    return value;
  }

  evaluate() {
    this.value = this.get();
    this.dirty = false;
  }

  depend() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].depend();
    }
  }

  addDep(dep: Dep) {
    const id = dep.id;
    if (!this.depIds.has(id)) {
      this.depIds.add(id);
      this.deps.push(dep);
      dep.addWatch(this);
    }
  }

  update() {
    if (this.lazy) {
      this.dirty = true;
    } else {
      const value = this.get();
      if (value !== this.value || isObject(value) || this.deep) {
        const oldValue = this.value;
        this.value = value;
        this.cb.call(this.vm, this.value, oldValue);
      }
    }
  }

  teardown() {
    let i = this.deps.length;
    while (i--) {
      this.deps[i].removeWatch(this);
    }
  }
}
