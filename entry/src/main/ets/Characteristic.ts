import ble from '@ohos.bluetooth.ble';
import { Service } from './Service';
import { BleUtils } from './BleUtils'
import { Descriptor } from './Descriptor'
import { IdGenerator } from './utils/IdGenerator';
import { IdGeneratorKey } from './utils/IdGeneratorKey';
import Logger from './Logger';
import { ValuesBucket } from '@kit.ArkData';

export class Characteristic {

  private id: number;
  private serviceID: number;
  private serviceUUID: string;
  private deviceID: string;
  private value: ArrayBuffer;
  public gattCharacteristic: ble.BLECharacteristic;

  public writeType: ble.GattWriteType;

  public setValue(value: ArrayBuffer) {
    this.value = value;
  }

  constructor(id: number, deviceID: string, serviceID: number, serviceUUID: string, gattCharacteristic: ble.BLECharacteristic) {
    this.id = id;
    this.deviceID = deviceID;
    this.serviceUUID = serviceUUID;
    this.serviceID = serviceID;
    this.gattCharacteristic = gattCharacteristic;
  }

  static constructorWithId(id: number, service: Service, gattCharacteristic: ble.BLECharacteristic): Characteristic {
    return new Characteristic(id, service.getDeviceID(), service.getId(), service.getUuid(), gattCharacteristic);
  }

  static constructorWithNative(service: Service, gattCharacteristic: ble.BLECharacteristic): Characteristic {
    let id: number = IdGenerator.getIdForKey(new IdGeneratorKey(service.getDeviceID(), gattCharacteristic.characteristicUuid, BleUtils.getInstanceId(gattCharacteristic.characteristicUuid)))
    return new Characteristic(id, service.getDeviceID(), service.getId(), service.getUuid(), gattCharacteristic);
  }

  static constructorWithChar(other: Characteristic): Characteristic {
    return new Characteristic(other.id, other.deviceID, other.serviceID, other.serviceUUID, other.gattCharacteristic);
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

  public getDeviceId(): string {
    return this.deviceID;
  }

  public getInstanceId(): number {
    return BleUtils.getInstanceId(this.gattCharacteristic.characteristicUuid);
  }

  public getGattDescriptor(uuid: string): ble.BLEDescriptor | null {
    let descriptor: ble.BLEDescriptor = null;
    this.gattCharacteristic.descriptors.forEach(value => {
      if (value.descriptorUuid == uuid) {
        descriptor = value;
      }
    })

    return descriptor;
  }

  public setWriteType(writeType: number) {
    this.writeType = writeType;
  }

  public isReadable(): boolean {
    return this.gattCharacteristic.properties.read ?? false;
  }

  public isWritableWithResponse(): boolean {
    if (this.gattCharacteristic.properties) {
      if (this.gattCharacteristic.properties.writeNoResponse) {
        return false
      }
      return true;
    }
    return false;
  }

  public isWritableWithoutResponse(): boolean {
    return this.gattCharacteristic.properties.writeNoResponse ?? false;
  }

  public isNotifiable(): boolean {
    return this.gattCharacteristic.properties.notify ?? false;
  }

  public getDescriptors(): Descriptor[] {
    var descriptors: Descriptor[] = []
    this.gattCharacteristic.descriptors.forEach(value => {
      let obj = Descriptor.constructorWithNative(this, value);
      descriptors.push(obj);
    });
    return descriptors;
  }

  public isNotifying(): boolean {
    return false;
  }

  public isIndicatable(): boolean {
    return this.gattCharacteristic.properties.indicate;
  }

  public getValue(): ArrayBuffer {
    return this.value;
  }

  public getDescriptorByUUID(uuid: string): Descriptor {
    let descriptor: Descriptor = null;
    this.gattCharacteristic.descriptors.forEach(value => {
      if (value.descriptorUuid == uuid) {
        descriptor = Descriptor.constructorWithNative(this, value);
      }
    })
    return descriptor;
  }

  public logValue(message: string, value: ArrayBuffer) {
    Logger.debug(message);
  }

  public toJSObject(characteristic:Characteristic):Object{
    return {
      "id":characteristic.getId(),
      "uuid":characteristic.getUuid(),
      "deviceID":characteristic.getDeviceId(),
      "serviceID":characteristic.getServiceID(),
      "serviceUUID":characteristic.getServiceUUID(),
      "isReadable":characteristic.isReadable(),
      "isWritableWithResponse":characteristic.isWritableWithResponse(),
      "isWritableWithoutResponse":characteristic.isWritableWithoutResponse(),
      "isNotifiable":characteristic.isNotifiable(),
      "isNotifying":characteristic.isNotifying(),
      "isIndicatable":characteristic.isIndicatable(),
      "value":characteristic.getValue(),
    };
  }
}