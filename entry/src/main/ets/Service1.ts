import ble from '@ohos.bluetooth.ble';

export class Service {

  private id: number;

  private deviceID: string;

  private btGattService: ble.GattService;

  public Service(id: number, deviceID: string, btGattService: ble.GattService) {
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
}