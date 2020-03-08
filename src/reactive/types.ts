export interface IWatchOptions {
  immediate?: boolean;
  deep?: boolean;
  lazy?: boolean;
}

export type IWatchCallback = (n: any, o?: any) => any;

export type IWatchExpOrFn = string | (() => any);

export type IComputedItem = (() => any) | { get: () => any; set: (...args: any) => any };
export type IComputed = Record<string, IComputedItem>;
