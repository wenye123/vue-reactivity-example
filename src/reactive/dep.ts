import { Watcher } from "./watcher";
import { Window } from "./utils";

let uid = 0;

/** 依赖管理类 */
export class Dep {
  private watchers: Array<Watcher>;
  id: number;

  constructor() {
    this.watchers = [];
    this.id = uid++;
  }

  addSub(watch: Watcher) {
    this.watchers.push(watch);
  }

  removeSub(watch: Watcher) {
    const index = this.watchers.indexOf(watch);
    if (index > -1) {
      return this.watchers.splice(index, 1);
    }
  }

  depend() {
    if (Window.target) {
      // this.addSub(Window.target); // 废弃
      (Window.target as Watcher).addDep(this);
    }
  }

  notify() {
    this.watchers.forEach(watch => {
      watch.update();
    });
  }
}
