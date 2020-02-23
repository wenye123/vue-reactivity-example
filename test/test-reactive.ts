import { Wue } from "../src/reactive/index";
import { assert } from "chai";

describe("测试响应式", function() {
  let wue: Wue & Record<string, any>;
  beforeEach(function() {
    wue = new Wue({ name: "wenye", info: { name: "wenye", arr: [1, { name: "wenye" }] } });
  });

  it("单层对象", function() {
    wue.$watch("name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.name = "yiye";
  });

  it("多层对象", function() {
    wue.$watch("info.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.info.name = "yiye";
  });

  it("数组方法&数组新增元素", function() {
    // 数组方法
    wue.$watch("info.arr", (n, o) => {
      assert.strictEqual(n.length, 3);
    });
    wue.info.arr.push({ name: "wenye" });
    // 数组新增元素
    wue.$watch("info.arr.2.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.info.arr[2].name = "yiye";
  });

  it("数组内元素", function() {
    wue.$watch("info.arr.1.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.info.arr[1].name = "yiye";
  });

  it("watch fn", function() {
    let obj: any;
    wue.$watch(
      function(this: Wue & Record<string, any>) {
        return this.name + this.info.name;
      },
      (n, o) => {
        assert.deepEqual({ n, o }, obj);
      },
    );
    obj = { n: "yiyewenye", o: "wenyewenye" };
    wue.name = "yiye";
    obj = { n: "yiyeyiye", o: "yiyewenye" };
    wue.info.name = "yiye";
  });

  it("watch立即执行", function() {
    wue.$watch(
      "name",
      n => {
        assert.strictEqual(n, "wenye");
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
    const unWatcher = wue.$watch("name", (n, o) => {
      throw new Error("不该执行");
    });
    unWatcher();
    wue.name = "yiye";
  });
});
