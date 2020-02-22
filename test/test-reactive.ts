import { Wue } from "../src/reactive/index";
import { assert } from "chai";

describe("测试响应式", function() {
  let wue: Wue;
  before(function() {
    wue = new Wue({ name: "wenye", info: { name: "wenye", arr: [1, { name: "wenye" }] } });
  });

  it("单层对象", function() {
    wue.watch("name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.data.name = "yiye";
  });

  it("多层对象", function() {
    wue.watch("info.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.data.info.name = "yiye";
  });

  it("数组方法", function() {
    wue.watch("info.arr", (n, o) => {
      assert.strictEqual(n.length, 3);
    });
    wue.data.info.arr.push({ name: "wenye" });
  });

  it("数组新增元素", function() {
    wue.watch("info.arr.2.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.data.info.arr[2].name = "yiye";
  });

  it("数组内元素", function() {
    wue.watch("info.arr.1.name", (n, o) => {
      assert.strictEqual(n, "yiye");
      assert.strictEqual(o, "wenye");
    });
    wue.data.info.arr[1].name = "yiye";
  });
});
