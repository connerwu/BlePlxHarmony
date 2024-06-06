import ble from '@ohos.bluetooth.ble';
import { Characteristic } from './Characteristic';

export class Service {

  private id: number;
  private deviceID: string;
  private btGattService: ble.GattService;

  constructor(id: number, deviceID: string, btGattService: ble.GattService) {
    this.id = id;
    this.deviceID = deviceID;
    this.btGattService = btGattService;
  }

  public getId(): number {
    return this.id;
  }

  public getUuid(): string {
    return this.btGattService.serviceUuid;
  }

  public getDeviceID(): string {
    return this.deviceID;
  }

  public isPrimary(): boolean {
    return this.btGattService.isPrimary;
  }

  public getCharacteristicByUUID(uuid: string): Characteristic | null {
    var characteristic: Characteristic = null;
    this.btGattService.characteristics.forEach(value => {
      if (value.characteristicUuid == uuid) {
        characteristic = Characteristic.constructorWithNative(this, value);
      }
    })

    return characteristic;
  }

  public getCharacteristics(): Characteristic[] {
    var characteristics: Characteristic[] = []
    this.btGattService.characteristics.forEach(value => {
      let obj = Characteristic.constructorWithNative(this, value);
      characteristics.push(obj);
    });
    return characteristics;
  }
}