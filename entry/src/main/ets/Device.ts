import { Service } from './Service'
import { ble } from '@kit.ConnectivityKit';

export class Device {
  private id: string;

  private name: string;

  private services: Service[];

  public clientDevice: ble.GattClientDevice;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public getId(): string {
    return this.id;
  }

  public setId(id: string) {
    this.id = id;
  }

  public getName(): string {
    return this.name;
  }

  public setName(name: string) {
    this.name = name;
  }

  public getServices(): Service[] {
    return this.services;
  }

  public setServices(services: Service[]) {
    this.services = services;
  }

  public getServiceByUUID(uuid: string): Service | null {
    if (this.services == null) {
      return null;
    }

    this.services.forEach(value => {
      if (value.getUuid() == uuid) {
        return value;
      }
    });
    return null;
  }
}