import { BleErrorCode } from './BleErrorCode';

export class BleError extends Error {
  public errorCode: BleErrorCode;
  public androidCode?: number;
  public reason: string;
  public deviceID?: string;
  public serviceUUID?: string;
  public characteristicUUID?: string;
  public descriptorUUID?: string;
  public internalMessage?: string;

  constructor(errorCode: BleErrorCode, reason: string, androidCode?: number) {
    super(`Error code: ${errorCode}, android code: ${androidCode}, reason: ${reason}`);
    this.errorCode = errorCode;
    this.reason = reason;
    this.androidCode = androidCode;
  }

  // 注意：在TypeScript中，通常不直接重写getMessage方法，因为Error类的toString方法会自动调用它。
  // 但如果你想自定义错误信息的获取方式，可以这样做：
  getCustomMessage(): string {
    return `Error code: ${this.errorCode}, android code: ${this.androidCode}, reason: ${this.reason}, ` +
      `deviceId: ${this.deviceID}, serviceUuid: ${this.serviceUUID}, ` +
      `characteristicUuid: ${this.characteristicUUID}, descriptorUuid: ${this.descriptorUUID}, ` +
      `internalMessage: ${this.internalMessage}`;
  }
}
