import ble from '@ohos.bluetooth.ble';
import { Service } from './Service1';

export class Characteristic {

  private id: number;

  private serviceID: number;

  private serviceUUID: string;

  private deviceID: string;

  public gattCharacteristic: ble.BLECharacteristic;

  public Characteristic(service: Service, gattCharacteristic: ble.BLECharacteristic) {
    // TODO:
    let id: number = 0;
    this.CharacteristicWithId(id, service, gattCharacteristic);
  }

  public CharacteristicWithId(id: number, service: Service, gattCharacteristic: ble.BLECharacteristic) {
    this.id = id;
    this.deviceID = service.getDeviceID();
    this.serviceUUID = service.getUuid();
    this.serviceID = service.getId();
    this.gattCharacteristic = gattCharacteristic;
  }

  public CharacteristicWithChar(other: Characteristic) {
    this.id = other.id;
    this.serviceID = other.serviceID;
    this.serviceUUID = other.serviceUUID;
    this.deviceID = other.deviceID;
    // TODO:
    this.gattCharacteristic = other.gattCharacteristic;
  }

  public getId(): number {
    return this.id;
  }

  public getUuid(): string {
    return this.gattCharacteristic.characteristicUuid;
  }

  public getServiceID(): number {
    return this.serviceID;
  }

  public getServiceUUID(): string {
    return this.serviceUUID;
  }

  public getDeviceID(): string {
    return this.deviceID;
  }

  // public getInstanceId(): number {
  //   return this.gattCharacteristic.
  // }
}