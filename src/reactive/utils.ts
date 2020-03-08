/** 解析对象访问字符串 */
const bailRe = /[^\w.$]/;
export function parsePath(path: string) {
  if (bailRe.test(path)) return;
  const segments = path.split(".");
  return function(obj: Record<string, any>) {
    for (let i = 0; i < segments.length; i++) {
      if (!obj) return;
      obj = obj[segments[i]];
    }
    return obj;
  };
}

/** 是否对象 */
export function isObject(val: any) {
  return val !== null && typeof val === "object";
}

/** 是否拥有该属性 */
export function hasOwn(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/** 定义属性 */
export function def(obj: any, key: string, val: any, enumerable: boolean = false) {
  Object.defineProperty(obj, key, {
    enumerable,
    writable: true,
    configurable: true,
    value: val,
  });
}

/** 是否存在__proto__属性 */
export const hasProto = "__proto__" in {};

/** 代理属性 */
export function proxy(target: any, sourceKey: string, key: string) {
  Object.defineProperty(target, key, {
    get() {
      return this[sourceKey][key];
    },
    set(val: any) {
      this[sourceKey][key] = val;
    },
  });
}

/** 是否有效的数组索引 */
export function isValidArrayIndex(key: string | number) {
  const n = parseFloat(String(key));
  return n >= 0 && Math.floor(n) === n && isFinite(key as number);
}
