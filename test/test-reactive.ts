import { Wue } from "../src/index";
import { assert } from "chai";

describe("测试响应式", function() {
  let wue: Wue & Record<string, any>;
  let openidNameCount1 = 0,
    openidNameCount2 = 0;
  beforeEach(function() {
    wue = new Wue({
      data: { openid: "12345", info: { name: "wenye", hobby: ["唱歌", { tag: "跳舞", weight: 3 }] } },
      computed: {
        openidName1() {
          openidNameCount1++;
          return `${this.openid}:${this.info.name}:1`;
        },
        openidName2: {
          get(this: any): string {
            openidNameCount2++;
            return `${this.openid}:${this.info.name}:2`;
          },
          set(this: any, openid: string) {
            this.openid = openid;
          },
        },
      },
    });
  });

  it("单层对象", function() {
    wue.$watch("openid", (n, o) => {
      assert.strictEqual(n, "54321");
      assert.strictEqual(o, "12345");
    });
    wue.name = "54321";
  });

  it("多层对象", function() {
    wue.$watch("info.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.info.name = "yiye";
  });

  it("数组内元素", function() {
    wue.$watch("info.hobby.1.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.info.hobby[1].name = "yiye";
  });

  it("数组方法&数组新增元素", function() {
    // 数组方法
    wue.$watch("info.hobby", (n, o) => {
      assert.strictEqual(n.length, 3);
    });
    wue.info.hobby.push({ tag: "篮球" });
    // 数组新增元素
    wue.$watch("info.hobby.2.tag", (n, o) => {
      assert.strictEqual(n, "rap");
      assert.strictEqual(o, "篮球");
    });
    wue.info.hobby[2].name = "rap";
  });

  it("watch fn", function() {
    let obj: any;
    wue.$watch(
      function(this: Wue & Record<string, any>) {
        return this.openid + ":" + this.info.name;
      },
      (n, o) => {
        assert.deepEqual({ n, o }, obj);
      },
    );
    obj = { n: "54321:wenye", o: "12345:wenye" };
    wue.openid = "54321";
    obj = { n: "54321:yiye", o: "54321:wenye" };
    wue.info.name = "yiye";
  });

  it("watch立即执行", function() {
    wue.$watch(
      "openid",
      n => {
        assert.strictEqual(n, "12345");
      },
      {
        immediate: true,
      },
    );
  });

  it("watch deep", function() {
    wue.$watch(
      "info",
      (n, o) => {
        assert.strictEqual(n.name, "yiye");
      },
      { deep: true },
    );
    wue.info.name = "yiye";
  });

  it("unwatch", function() {
    const unWatcher = wue.$watch("openid", (n, o) => {
      throw new Error("不该执行");
    });
    unWatcher();
    wue.openid = "54321";
  });

  it("$set新增对象属性", function() {
    wue.$watch("info", (n, o) => {
      assert.strictEqual(n.age, 22);
    });
    wue.$set(wue.info, "age", 22);
    // 新属性响应监听
    wue.$watch("info.age", (n, o) => {
      assert.deepEqual({ n, o }, { n: 23, o: 22 });
    });
    wue.info.age = 23;
  });

  it("$set新增数组属性", function() {
    wue.$watch("info.hobby", n => {
      assert.strictEqual(n.length, 3);
    });
    wue.$set(wue.info.hobby, 2, { tag: "rap" });
    // 新属性响应监听
    wue.$watch("info.hobby.2.tag", (n, o) => {
      assert.deepEqual({ n, o }, { n: "跳舞", o: "rap" });
    });
    wue.info.hobby[2].tag = "跳舞";
  });

  it("$del删除属性", function() {
    wue.$watch("info", n => {
      assert.notExists(n.name, undefined);
    });
    wue.$del(wue.info, "name");
  });

  it("$del删除数组", function() {
    wue.$watch("info.hobby", n => {
      assert.strictEqual(n.length, 1);
    });
    wue.$del(wue.info.hobby, 0);
  });

  it("computed function", function(done) {
    // 模拟重新渲染watcher
    wue.$watch("openidName1", () => {
      assert.strictEqual(wue.openidName1, "54321:wenye:1");
      done();
    });
    assert.strictEqual(wue.openidName1, "12345:wenye:1");
    assert.strictEqual(openidNameCount1, 1);
    // 再次读取不重复计算
    assert.strictEqual(openidNameCount1, 1);
    // 修改计算属性的依赖
    wue.openid = "54321";
  });

  it("computed get", function(done) {
    // 模拟重新渲染watcher
    wue.$watch("openidName2", () => {
      assert.strictEqual(wue.openidName2, "54321:wenye:2");
      done();
    });
    assert.strictEqual(wue.openidName2, "12345:wenye:2");
    assert.strictEqual(openidNameCount2, 1);
    // 再次读取不重复计算
    assert.strictEqual(openidNameCount2, 1);
    // 修改计算属性的依赖
    wue.openid = "54321";
  });

  it("computed set", function() {
    wue.openidName2 = "54321";
    assert.strictEqual(wue.openid, "54321");
  });
});
