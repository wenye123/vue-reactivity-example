export interface IWatchOptions {
  immediate?: boolean;
  deep?: boolean;
}

export type IWatchCallback = (n: any, o?: any) => any;

export type IWatchExpOrFn = string | (() => any);
