import { Watcher } from "./watcher";
import { Window } from "./utils";

let uid = 0;

/** 依赖收集类 */
export class Dep {
  private subs: Array<Watcher>;
  id: number;

  constructor() {
    this.subs = [];
    this.id = uid++;
  }

  addSub(sub: Watcher) {
    this.subs.push(sub);
  }

  removeSub(sub: Watcher) {
    const index = this.subs.indexOf(sub);
    if (index > -1) {
      return this.subs.splice(index, 1);
    }
  }

  depend() {
    if (Window.target) {
      // this.addSub(Window.target); // 废弃
      (Window.target as Watcher).addDep(this);
    }
  }

  notify() {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}
