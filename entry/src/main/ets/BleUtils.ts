import { BusinessError } from '@ohos.base';


// export type Resolve = (value?: any) => void;

// 成功回调函数
export interface Resolve<T> {
  (data?: T): void;
}

// 失败回调函数
// export type Reject = (code?: number, message?: string, error?: BusinessError) => void;
export type Reject = (code?: number, message?: string) => void;

// 字符串转ArrayBuffer
export function stringToArrayBuffer(string) {
  var buffer = new ArrayBuffer(string.length);
  var bufferView = new Uint8Array(buffer);

  for (var i = 0; i < string.length; i++) {
    bufferView[i] = string.charCodeAt(i);
  }

  return buffer;
}

export class BleUtils {
  static instanceMap: Map<string, number> = new Map();

  // 根据uuid生成instantId
  static getInstanceId(uuid: string): number {
    let value = this.instanceMap.get(uuid);
    if (value == null) {
      value = new Date().getTime();
      this.instanceMap.set(uuid, value);
    }
    return value;
  }
}