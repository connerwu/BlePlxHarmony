import ble from '@ohos.bluetooth.ble';

export class Service {
  private readonly id: number;
  private readonly deviceID: string;
  private readonly btGattService: ble.GattService;

  constructor(id: number, deviceID: string, btGattService: ble.GattService) {
    this.id = id;
    this.deviceID = deviceID;
    this.btGattService = btGattService;
  }

  getId(): number {
    return this.id;
  }

  getUuid(): string {
    return this.btGattService.serviceUuid;
  }

  getDeviceID(): string {
    return this.deviceID;
  }

  isPrimary(): boolean {
    return this.btGattService.isPrimary; // 假设 getType 返回的是字符串
  }

  getCharacteristicByUUID(uuid: string): ble.BLECharacteristic | null {
    let characteristic = null;
    let characteristicList = this.getCharacteristics();

    characteristicList.forEach((value, index, array) => {
      if (value.serviceUuid == uuid) {
        characteristic = value;
      }
    })

    return characteristic ?? null;
  }

  getCharacteristics(): ble.BLECharacteristic[] {
    return this.btGattService.characteristics; // 假设 getCharacteristics 直接返回数组
  }
}
