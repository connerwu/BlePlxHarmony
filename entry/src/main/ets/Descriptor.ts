import ble from '@ohos.bluetooth.ble';
import { Characteristic } from './Characteristic';
import { IdGenerator } from './utils/IdGenerator';
import { IdGeneratorKey } from './utils/IdGeneratorKey';
import Logger from './Logger'

export class Descriptor {
  private characteristicId: number;
  private serviceId: number;
  private characteristicUuid: string;
  private serviceUuid: string;
  private deviceId: string;
  private descriptor: ble.BLEDescriptor;
  private id: number;
  private uuid: string;
  private value: ArrayBuffer;

  constructor(id: number,
              uuid: string,
              value: ArrayBuffer,
              deviceId: string,
              serviceId: number,
              serviceUuid: string,
              characteristicId: number,
              characteristicUuid: string,
              descriptor: ble.BLEDescriptor) {
    this.id = id;
    this.uuid = uuid;
    this.value = value;
    this.deviceId = deviceId;
    this.serviceId = serviceId;
    this.serviceUuid = serviceUuid;
    this.characteristicId = characteristicId;
    this.characteristicUuid = characteristicUuid;
    this.descriptor = descriptor;
  }

  static constructorWithNative(characteristic: Characteristic, gattDescriptor: ble.BLEDescriptor) {
    let id = IdGenerator.getIdForKey(new IdGeneratorKey(characteristic.getDeviceId(), gattDescriptor.descriptorUuid, characteristic.getId()));
    return new Descriptor(id, gattDescriptor.descriptorUuid, gattDescriptor.descriptorValue, characteristic.getDeviceId(), characteristic.getServiceID(), characteristic.getServiceUUID(), characteristic.getId(), characteristic.getUuid(), gattDescriptor)
  }

  static constructorWithId(characteristicId: number, serviceId: number, characteristicUuid: string, serviceUuid: string, deviceId: string, descriptor: ble.BLEDescriptor, id: number, uuid: string) {
    return new Descriptor(id, uuid, descriptor.descriptorValue, deviceId, serviceId, serviceUuid, characteristicId, characteristicUuid, descriptor)
  }

  static constructorWithOther(other: Descriptor) {
    return new Descriptor(other.id, other.uuid, other.value, other.deviceId, other.serviceId, other.serviceUuid, other.characteristicId, other.characteristicUuid, other.descriptor)
  }

  public getId(): number {
    return this.id;
  }

  public getDeviceId(): string {
    return this.deviceId;
  }

  public getCharacteristicId(): number {
    return this.characteristicId;
  }

  public getServiceId(): number {
    return this.serviceId;
  }

  public getCharacteristicUuid(): string {
    return this.characteristicUuid;
  }

  public getServiceUuid(): string {
    return this.serviceUuid;
  }

  public getUuid(): string {
    return this.uuid;
  }

  public getValue(): ArrayBuffer {
    return this.value;
  }

  public setValue(value: ArrayBuffer) {
    this.value = value;
  }

  public setValueFromCache() {
    this.value = this.descriptor.descriptorValue;
  }

  public getNativeDescriptor(): ble.BLEDescriptor {
    return this.descriptor;
  }

  public logValue(message: string, value: ArrayBuffer) {
    Logger.debug(message);
  }

  public toJSObject(descriptor:Descriptor):Object{
    return {
      "id":descriptor.getId(),
      "uuid":descriptor.getUuid(),
      "deviceID":descriptor.getDeviceId(),
      "serviceID":descriptor.getServiceId(),
      "serviceUUID":descriptor.getServiceUuid(),
      "characteristicUUID":descriptor.getCharacteristicUuid(),
      "characteristicID":descriptor.getCharacteristicId(),
      "value":descriptor.getValue(),
    };
  }
}