import { Watcher } from "./watcher";

let uid = 0;

/** 依赖管理类 */
export class Dep {
  static target: Watcher | undefined;
  private watchers: Array<Watcher>;
  id: number;

  constructor() {
    this.watchers = [];
    this.id = uid++;
  }

  /** 添加依赖 */
  addWatch(watch: Watcher) {
    this.watchers.push(watch);
  }

  /** 移除依赖 */
  removeWatch(watch: Watcher) {
    const index = this.watchers.indexOf(watch);
    if (index > -1) {
      return this.watchers.splice(index, 1);
    }
  }

  /** 收集依赖 */
  depend() {
    if (Dep.target) {
      // this.addSub(Window.target); // 废弃
      Dep.target.addDep(this);
    }
  }

  /** 触发依赖更新 */
  notify() {
    this.watchers.forEach(watch => {
      watch.update();
    });
  }
}

const targetStack: Watcher[] = [];

export function pushTarget(watcher: Watcher) {
  if (Dep.target) targetStack.push(Dep.target);
  Dep.target = watcher;
}

export function popTarget() {
  Dep.target = targetStack.pop();
}
