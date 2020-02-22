import { parsePath, Window } from "./utils";

/** 依赖类 */
export class Watcher {
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
    Window.target = this;
    let value = this.getter.call(this.vm, this.vm);
    Window.target = undefined;
    return value;
  }
  update() {
    const oldValue = this.value;
    this.value = this.get();
    this.cb.call(this.vm, this.value, oldValue);
  }
}
