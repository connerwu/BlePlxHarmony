import Logger from './common/Logger'
import { BleEvent } from './common/BleEvent';
import { BleClientManager } from './BleModule'
import { Resolve, Reject } from './common/BleUtils'
import { BlePlxInterface } from './BlePlxInterface'
import { ValuesBucket, ValueType } from '@kit.ArkData';
// import { RNInstance } from '../../../RNOH/ts';

export class BlePlxModule implements BlePlxInterface {
  private manager: BleClientManager;

  public dispatchEvent(name: string, value: any) {
    Logger.debug('Event name: ' + name, ', value: ' + JSON.stringify(value));
    // TODO: RN Event
    // this.sendEvent(name, value);
  }

  public createClient(restoreStateIdentifier: string) {
    this.manager = new BleClientManager(restoreStateIdentifier);
    this.manager.delegate = this;
  }

  public destroyClient() {
    this.manager.invalidate();
    this.manager = null;
  }

  // Mark: Monitoring state ----------------------------------------------------------------------

  public enable(transaction: string, resolve: Resolve<Object>, reject: Reject) {
    this.manager.enable(transaction, resolve, reject);
  }

  public disable(transactionId: string, resolve: Resolve<Object>, reject: Reject) {
    this.manager.disable(transactionId, resolve, reject);
  }

  public state(resolve: Resolve<Object>, reject: Reject) {
    this.manager.state(resolve, reject);
  }

  // 测试专用，发布时删除此方法
  public startDeviceScanForDev(filteredUUIDs?: Array<string>, options?: Map<string, number>, resolve?: Resolve<ValuesBucket>, reject?: Reject) {
    this.manager.startDeviceScan(filteredUUIDs, options, resolve, reject);
  }

  public startDeviceScan(filteredUUIDs?: Array<string>, options?: Map<string, number>) {
    this.manager.startDeviceScan(filteredUUIDs, options, (data => {
      this.dispatchEvent(BleEvent.scanEvent, [null, data]);
    }), (code, message) => {
      this.dispatchEvent(BleEvent.scanEvent, message);
    });
  }

  public stopDeviceScan() {
    this.manager.stopDeviceScan();
  }

  public requestConnectionPriorityForDevice(deviceIdentifier: string,
                                            connectionPriority: number,
                                            transactionId: string,
                                            resolve: Resolve<ValuesBucket>,
                                            reject: Reject) {
    this.manager.requestConnectionPriorityForDevice(deviceIdentifier, connectionPriority, transactionId, resolve, reject);
  }

  public readRSSIForDevice(deviceIdentifier: string, transactionId: string, resolve: Resolve<ValuesBucket>, reject: Reject) {
    this.manager.readRSSIForDevice(deviceIdentifier, transactionId, resolve, reject);
  }

  public requestMTUForDevice(deviceIdentifier: string,
                             mtu: number,
                             transactionId: string,
                             resolve: Resolve<ValuesBucket>,
                             reject: Reject) {
    this.requestConnectionPriorityForDevice(deviceIdentifier, mtu, transactionId, resolve, reject);
  }

  public devices(deviceIdentifiers: Array<string>,
                 resolve: Resolve<Array<ValuesBucket>>,
                 reject: Reject) {
    this.manager.devices(deviceIdentifiers, resolve, reject);
  }

  public connectedDevices(deviceIdentifiers: Array<string>,
                             resolve: Resolve<Array<ValuesBucket>>,
                             reject: Reject) {
    this.manager.getConnectedDevices(deviceIdentifiers, resolve, reject);
  }

  public connectToDevice(deviceIdentifier: string,
                         options: Map<string, ValueType>,
                         resolve: Resolve<ValuesBucket>,
                         reject: Reject) {
    this.manager.connectToDevice(deviceIdentifier, options, resolve, reject);
  }

  public cancelDeviceConnection(deviceIdentifier: string, resolve: Resolve<ValuesBucket>, reject: Reject) {
    this.manager.cancelDeviceConnection(deviceIdentifier, resolve, reject);
  }

  public isDeviceConnected(deviceIdentifier: string, resolve: Resolve<boolean>, reject: Reject) {
    this.manager.isDeviceConnected(deviceIdentifier, resolve, reject);
  }

  // Mark: Discovery ---------------------------------------------------------------------------------------------------

  public discoverAllServicesAndCharacteristicsForDevice(deviceIdentifier: string,
                                                        transactionId: string,
                                                        resolve: Resolve<ValuesBucket>,
                                                        reject: Reject) {
    this.manager.discoverAllServicesAndCharacteristicsForDevice(deviceIdentifier, transactionId, resolve, reject);
  }

  public servicesForDevice(deviceIdentifier: string, resolve: Resolve<Array<ValuesBucket>>, reject: Reject) {
    this.manager.servicesForDevice(deviceIdentifier, resolve, reject);
  }

  public characteristicsForDevice(deviceIdentifier: string,
                                  serviceUUID: string,
                                  resolve: Resolve<Array<ValuesBucket>>,
                                  reject: Reject) {
    this.manager.characteristicsForDevice(deviceIdentifier, serviceUUID, resolve, reject);
  }

  public descriptorsForDevice(deviceIdentifier: string,
                              serviceUUID: string,
                              characteristicUUID: string,
                              resolve: Resolve<Array<ValuesBucket>>,
                              reject: Reject) {
    this.manager.descriptorsForDevice(deviceIdentifier, serviceUUID, characteristicUUID, resolve, reject);
  }

  public descriptorsForService(serviceIdentifier: number,
                               characteristicUUID: string,
                               resolve: Resolve<Array<ValuesBucket>>,
                               reject: Reject) {
    this.manager.descriptorsForService(serviceIdentifier, characteristicUUID, resolve, reject);
  }

  public descriptorsForCharacteristic(characteristicIdentifier: number,
                                      resolve: Resolve<Array<ValuesBucket>>,
                                      reject: Reject) {
    this.manager.descriptorsForCharacteristic(characteristicIdentifier, resolve, reject);
  }

  public readCharacteristicForDevice(deviceIdentifier: string,
                                     serviceUUID: string,
                                     characteristicUUID: string,
                                     transactionId: string,
                                     resolve: Resolve<ValuesBucket>,
                                     reject: Reject) {
    this.manager.readCharacteristicForDevice(deviceIdentifier, serviceUUID, characteristicUUID, transactionId, resolve, reject);
  }

  public readCharacteristicForService(serviceIdentifier: number,
                                      characteristicUUID: string,
                                      transactionId: string,
                                      resolve: Resolve<ValuesBucket>,
                                      reject: Reject) {
    this.manager.readCharacteristicForService(serviceIdentifier, characteristicUUID, transactionId, resolve, reject);
  }

  public readCharacteristic(characteristicIdentifier: number,
                            transactionId: string,
                            resolve: Resolve<ValuesBucket>,
                            reject: Reject) {
    this.manager.readCharacteristic(characteristicIdentifier, transactionId, resolve, reject);
  }

  public writeCharacteristicForDevice(deviceIdentifier: string,
                                      serviceUUID: string,
                                      characteristicUUID: string,
                                      valueBase64: string,
                                      response: boolean,
                                      transactionId: string,
                                      resolve: Resolve<ValuesBucket>,
                                      reject: Reject) {
    this.manager.writeCharacteristicForDevice(deviceIdentifier, serviceUUID, characteristicUUID, valueBase64, response, transactionId, resolve, reject);
  }

  public writeCharacteristicForService(serviceIdentifier: number,
                                       characteristicUUID: string,
                                       valueBase64: string,
                                       response: boolean,
                                       transactionId: string,
                                       resolve: Resolve<ValuesBucket>,
                                       reject: Reject) {
    this.manager.writeCharacteristicForService(serviceIdentifier, characteristicUUID, valueBase64, response, transactionId, resolve, reject);
  }

  public writeCharacteristic(characteristicIdentifier: number,
                             valueBase64: string,
                             response: boolean,
                             transactionId: string,
                             resolve: Resolve<ValuesBucket>,
                             reject: Reject) {
    this.manager.writeCharacteristic(characteristicIdentifier, valueBase64, response, transactionId, resolve, reject);
  }

  public monitorCharacteristicForDevice(deviceIdentifier: string,
                                        serviceUUID: string,
                                        characteristicUUID: string,
                                        transactionId: string,
                                        resolve: Resolve<ValuesBucket>,
                                        reject: Reject) {
    this.manager.monitorCharacteristicForDevice(deviceIdentifier, serviceUUID, characteristicUUID, transactionId, resolve, reject);
  }

  public monitorCharacteristicForService(serviceIdentifier: number,
                                         characteristicUUID: string,
                                         transactionId: string,
                                         resolve: Resolve<ValuesBucket>,
                                         reject: Reject) {
    this.manager.monitorCharacteristicForService(serviceIdentifier, characteristicUUID, transactionId, resolve, reject);
  }

  public monitorCharacteristic(characteristicIdentifier: number,
                               transactionId: string,
                               resolve: Resolve<ValuesBucket>,
                               reject: Reject) {
    this.manager.monitorCharacteristic(characteristicIdentifier, transactionId, resolve, reject);
  }

  public readDescriptorForDevice(deviceId: string,
                                 serviceUUID: string,
                                 characteristicUUID: string,
                                 descriptorUUID: string,
                                 transactionId: string,
                                 resolve: Resolve<ValuesBucket>,
                                 reject: Reject) {
    this.manager.readDescriptorForDevice(deviceId, serviceUUID, characteristicUUID, descriptorUUID, transactionId, resolve, reject);
  }

  public readDescriptorForService(serviceIdentifier: number,
                                  characteristicUUID: string,
                                  descriptorUUID: string,
                                  transactionId: string,
                                  resolve: Resolve<ValuesBucket>,
                                  reject: Reject) {
    this.manager.readDescriptorForService(serviceIdentifier, characteristicUUID, descriptorUUID, transactionId, resolve, reject);
  }

  public readDescriptorForCharacteristic(characteristicIdentifier: number,
                                         descriptorUUID: string,
                                         transactionId: string,
                                         resolve: Resolve<ValuesBucket>,
                                         reject: Reject) {
    this.manager.readDescriptorForCharacteristic(characteristicIdentifier, descriptorUUID, transactionId, resolve, reject);
  }

  public readDescriptor(descriptorIdentifier: number,
                        descriptorUUID: string,
                        transactionId: string,
                        resolve: Resolve<ValuesBucket>,
                        reject: Reject) {
    this.manager.readDescriptor(descriptorIdentifier, descriptorUUID, transactionId, resolve, reject);
  }

  public writeDescriptorForDevice(deviceId: string,
                                  serviceUUID: string,
                                  characteristicUUID: string,
                                  descriptorUUID: string,
                                  valueBase64: string,
                                  transactionId: string,
                                  resolve: Resolve<ValuesBucket>,
                                  reject: Reject) {
    this.manager.writeDescriptorForDevice(deviceId, serviceUUID, characteristicUUID, descriptorUUID, valueBase64, transactionId, resolve, reject);
  }

  public writeDescriptorForService(serviceIdentifier: number,
                                   characteristicUUID: string,
                                   descriptorUUID: string,
                                   valueBase64: string,
                                   transactionId: string,
                                   resolve: Resolve<ValuesBucket>,
                                   reject: Reject) {
    this.manager.writeDescriptorForService(serviceIdentifier, characteristicUUID, descriptorUUID, valueBase64, transactionId, resolve, reject);
  }

  public writeDescriptorForCharacteristic(characteristicIdentifier: number,
                                          descriptorUUID: string,
                                          valueBase64: string,
                                          transactionId: string,
                                          resolve: Resolve<ValuesBucket>,
                                          reject: Reject) {
    this.manager.writeDescriptorForCharacteristic(characteristicIdentifier, descriptorUUID, valueBase64, transactionId, resolve, reject);
  }

  public writeDescriptor(descriptorIdentifier: number,
                         valueBase64: string,
                         transactionId: string,
                         resolve: Resolve<ValuesBucket>,
                         reject: Reject) {
    this.manager.writeDescriptor(descriptorIdentifier, valueBase64, transactionId, resolve, reject);
  }

  public cancelTransaction(transactionId: string) {
    this.manager.cancelTransaction(transactionId);
  }

  public setLogLevel(logLevel: string) {
    this.manager.setLogLevel(logLevel);
  }

  public logLevel(resolve: Resolve<string>, reject: Reject) {
    this.manager.getLogLevel(resolve, reject);
  }
}