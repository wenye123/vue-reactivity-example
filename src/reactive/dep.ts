import { Watcher } from "./watcher";
import { Window } from "./utils";

/** 依赖收集类 */
export class Dep {
  private subs: Set<Watcher>;
  constructor() {
    this.subs = new Set();
  }
  private addSub(sub: Watcher) {
    this.subs.add(sub);
  }
  // private removeSub(sub: Watcher) {
  //   this.subs.delete(sub);
  // }
  depend() {
    if (Window.target) {
      this.addSub(Window.target);
    }
  }
  notify() {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}
