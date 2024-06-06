import ble from '@ohos.bluetooth.ble';
import { BusinessError } from '@ohos.base';
import { ValueType } from '@kit.ArkData';
import Logger from './Logger'
import { Resolve, Reject, stringToArrayBuffer } from './BleUtils'
import { constant } from '@kit.ConnectivityKit';
import { JSON } from '@kit.ArkTS';

export class BleClientManager {
  
  // 连接的设备
  private connectedDevices: Map<string, ble.GattClientDevice> = new Map<string, ble.GattClientDevice>();

  // Services
  private discoveredServices: Map<string, ble.GattService> = new Map<string, ble.GattService>();

  // Characteristics
  private discoveredCharacteristics: Map<string, ble.BLECharacteristic> = new Map<string, ble.BLECharacteristic>();

  // Descriptors
  private discoveredDescriptors: Map<string, ble.BLEDescriptor> = new Map<string, ble.BLEDescriptor>();

  // Mark: Scanning ------------------------------------------------------------------------------------------------------

  /**
   * @description 开始蓝牙扫描
   * @param filteredUUIDs: Array<string>
   * @param options: Map<string, number>
   */
  public startDeviceScan(filteredUUIDs?: Array<string>, options?: Map<string, number>, callback?: Function) {
    try {
      ble.on("BLEDeviceFind", (data: Array<ble.ScanResult>) => {
        Logger.debug('BLE scan device find result = ' + JSON.stringify(data));
        callback?.(data);
      });

      ///表示扫描结果过滤策略集合，如果不使用过滤的方式，该参数设置为null。
      let filters: Array<ble.ScanFilter> = null;
      if (filteredUUIDs && filteredUUIDs.length > 0) {
        filters = [];
        filteredUUIDs.forEach(item => {
          let scanFilter: ble.ScanFilter = {
            serviceUuid: item
          };
          filters.push(scanFilter);
        })
      }

      ///表示扫描的参数配置，可选参数。
      let scanOptions: ble.ScanOptions = null;
      if (options) {
        scanOptions = {
          //表示扫描结果上报延迟时间，默认值为0
          interval: options.get('interval'),
          //表示扫描模式，默认值为SCAN_MODE_LOW_POWER
          dutyMode: ble.ScanDuty.SCAN_MODE_LOW_POWER,
          //表示硬件的过滤匹配模式，默认值为MATCH_MODE_AGGRESSIVE
          matchMode: ble.MatchMode.MATCH_MODE_AGGRESSIVE,
        }
      }

      if (scanOptions) {
        ble.startBLEScan(filters, scanOptions);
      } else {
        ble.startBLEScan(filters);
      }
    } catch (err) {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
    }
  }

  /**
   * @description 停止蓝牙扫描
   */
  public stopDeviceScan() {
    try {
      ble.stopBLEScan();
    } catch (err) {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
    }
  }

  /**
   * @description Request a connection parameter update. This functions may update connection parameters on Android API level 21 or above.
   */
  public requestConnectionPriorityForDevice(deviceIdentifier: string,
                                            connectionPriority: number,
                                            transactionId: string,
                                            resolve: Resolve<ble.GattClientDevice>,
                                            reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    resolve(device);
  }

  /**
   * @description 读取RSSI
   */
  public readRSSIForDevice(deviceIdentifier: string,
                           transactionId: string,
                           resolve: Resolve<number>,
                           reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    device.getRssiValue((err: BusinessError, data: number) => {
      console.info('rssi err ' + JSON.stringify(err));
      console.info('rssi value' + JSON.stringify(data));
      if (err == null) {
        resolve(data);
      } else {
        reject(err.code, err.message, err);
      }
    })
  }

  /**
   * @description 请求MTU
   */
  public requestMTUForDevice(deviceIdentifier: string,
                             mtu: number,
                             transactionId: string,
                             resolve: Resolve<ble.GattClientDevice>,
                             reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    resolve(device);
  }

  // Mark: Connection Management ------------------------------------------------------------------------------------------------------

  /**
   * @description client端发起连接远端蓝牙低功耗设备
   */
  public connectToDevice(deviceIdentifier: string,
                         options: Map<string, ValueType>,
                         resolve: Resolve<constant.ProfileConnectionState>,
                         reject: Reject) {
    try {
      let device: ble.GattClientDevice = ble.createGattClientDevice(deviceIdentifier);
      device.on('BLEConnectionStateChange', (state: ble.BLEConnectionChangeState) => {
        Logger.debug('bluetooth connect state changed: ' + state.state);
        if (state.state == constant.ProfileConnectionState.STATE_CONNECTED) {
          this.connectedDevices.set(deviceIdentifier, device);
        } else {
          this.connectedDevices.delete(deviceIdentifier);
        }
        resolve(state.state);
      });
      device.connect();
    } catch (err) {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    }
  }

  /**
   * @description client端断开与远端蓝牙低功耗设备的连接
   */
  public cancelDeviceConnection(deviceIdentifier: string, resolve: Resolve<ble.GattClientDevice>, reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    try {
      device.disconnect();
      resolve(device);
    } catch (err) {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    }
  }

  /**
   * @description 设备是否已连接
   */
  public isDeviceConnected(deviceIdentifier: string, resolve: Resolve<boolean>, reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (device) {
      resolve(true);
    } else {
      resolve(false);
    }
  }

  // Mark: Discovery -----------------------------------------------------------------------------------------------------

  /**
   * @description 获取设备的服务和特征
   */
  public discoverAllServicesAndCharacteristicsForDevice(deviceIdentifier: string,
                                                        transactionId: string,
                                                        resolve: Resolve<ble.GattClientDevice>,
                                                        reject: Reject) {
    // TODO: transactionId
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    device.getServices().then(services => {
      // services
      services.forEach(service => {
        // Logger.debug('serviceUuid： ' + service.serviceUuid);
        this.discoveredServices.set(deviceIdentifier + '#' + service.serviceUuid, service);
        // characteristics
        service.characteristics.forEach(characteristic => {
          // Logger.debug('characteristicUuid： ' + characteristic.characteristicUuid);
          this.discoveredCharacteristics.set(deviceIdentifier + '#' + service.serviceUuid + '#' + characteristic.characteristicUuid, characteristic);
          // descriptors
          characteristic.descriptors.forEach(descriptor => {
            Logger.debug('serviceUuid： ' + service.serviceUuid);
            Logger.debug('characteristicUuid： ' + characteristic.characteristicUuid);
            Logger.debug('descriptorUuid： ' + descriptor.descriptorUuid);
            this.discoveredDescriptors.set(deviceIdentifier + '#' + service.serviceUuid + '#' + characteristic.characteristicUuid + '#' + descriptor.descriptorUuid, descriptor);
          })
        })
      })
      resolve(device);
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    });
  }

  // Mark: Service and characteristic getters ----------------------------------------------------------------------------

  /**
   * @description List of discovered services for specified device.
   */
  public servicesForDevice(deviceIdentifier: string, resolve: Resolve<Array<ble.GattService>>, reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    var results = new Array<ble.GattService>();
    Logger.debug('deviceIdentifier:' + deviceIdentifier);
    this.discoveredServices.forEach((value, key) => {
      Logger.debug('key:' + key);
      if (key.indexOf(deviceIdentifier) == 0) {
        results.push(value);
      }
    });

    resolve(results);
  }

  /**
   * @description List of discovered {@link Characteristic}s for given {@link Device} and {@link Service}.
   */
  public characteristicsForDevice(deviceIdentifier: string,
                                  serviceUUID: string,
                                  resolve: Resolve<Array<ble.BLECharacteristic>>,
                                  reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    var results = new Array<ble.BLECharacteristic>();
    this.discoveredCharacteristics.forEach((value, key) => {
      if (key.indexOf(deviceIdentifier + '#' + serviceUUID) == 0) {
        results.push(value);
      }
    });

    resolve(results);
  }

  /**
   * @description List of discovered {@link Descriptor}s for given {@link Device}, {@link Service} and {@link Characteristic}.
   */
  public descriptorsForDevice(deviceIdentifier: string,
                              serviceUUID: string,
                              characteristicUUID: string,
                              resolve: Resolve<Array<ble.BLEDescriptor>>,
                              reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    var results = new Array<ble.BLEDescriptor>();
    this.discoveredDescriptors.forEach((value, key) => {
      if (key.indexOf(deviceIdentifier + '#' + serviceUUID + '#' + characteristicUUID) == 0) {
        results.push(value);
      }
    });

    resolve(results);
  }

  /**
   * @description List of discovered descriptors for specified service.
   */
  public descriptorsForService(serviceIdentifier: string,
                               characteristicUUID: string,
                               resolve: Resolve<Array<ble.BLEDescriptor>>,
                               reject: Reject) {
    var results = new Array<ble.BLEDescriptor>();
    this.discoveredDescriptors.forEach((value, key) => {
      if (key.indexOf(serviceIdentifier + '#' + characteristicUUID) != -1) {
        results.push(value);
      }
    });

    resolve(results);
  }

  /**
   * @description List of discovered descriptors for specified characteristic.
   */
  public descriptorsForCharacteristic(characteristicIdentifier: string,
                                      resolve: Resolve<Array<ble.BLEDescriptor>>,
                                      reject: Reject) {
    var results = new Array<ble.BLEDescriptor>();
    this.discoveredDescriptors.forEach((value, key) => {
      if (key.indexOf(characteristicIdentifier) != -1) {
        results.push(value);
      }
    });

    resolve(results);
  }

  /**
   * @description Read characteristic's value.
   */
  public readCharacteristicForDevice(deviceIdentifier: string,
                                     serviceUUID: string,
                                     characteristicUUID: string,
                                     transactionId: string,
                                     resolve: Resolve<ble.BLECharacteristic>,
                                     reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    let characteristic = this.discoveredCharacteristics.get(deviceIdentifier + '#' + serviceUUID + '#' + characteristicUUID);
    if (!characteristic) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    device.readCharacteristicValue(characteristic).then(value => {
      resolve(value);
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    });
  }

  /**
   * @description Read characteristic's value.
   */
  public readCharacteristicForService(serviceIdentifier: string,
                                      characteristicUUID: string,
                                      transactionId: string,
                                      resolve: Resolve<ble.BLECharacteristic>,
                                      reject: Reject) {
    var deviceId = this.getDeviceId(serviceIdentifier, characteristicUUID);
    if (deviceId == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.readCharacteristicForDevice(deviceId, serviceIdentifier, characteristicUUID, transactionId, resolve, reject);
  }

  /**
   * @description Read characteristic's value.
   */
  public readCharacteristic(characteristicIdentifier: string,
                            transactionId: string,
                            resolve: Resolve<ble.BLECharacteristic>,
                            reject: Reject) {
    const [deviceId, serviceIdentifier] = this.getDeviceIdAndServiceId(characteristicIdentifier);
    if (deviceId == null || serviceIdentifier == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.readCharacteristicForDevice(deviceId, serviceIdentifier, characteristicIdentifier, transactionId, resolve, reject);
  }

  // MARK: Writing ---------------------------------------------------------------------------------------------------

  /**
   * @description Write value to characteristic.
   */
  public writeCharacteristicForDevice(deviceIdentifier: string,
                                      serviceUUID: string,
                                      characteristicUUID: string,
                                      valueBase64: string,
                                      response: boolean,
                                      transactionId: string,
                                      resolve: Resolve<ble.BLECharacteristic>,
                                      reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    let characteristic = this.discoveredCharacteristics.get(deviceIdentifier + '#' + serviceUUID + '#' + characteristicUUID);
    if (!characteristic) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    characteristic.characteristicValue = stringToArrayBuffer(valueBase64);

    device.writeCharacteristicValue(characteristic, response ? ble.GattWriteType.WRITE : ble.GattWriteType.WRITE_NO_RESPONSE).then(value => {
      Logger.debug('Write characteristic: ' + JSON.stringify(characteristic), +' value: ' + valueBase64);
      resolve(characteristic);
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    });
  }

  /**
   * @description Write value to characteristic.
   */
  public writeCharacteristicForService(serviceIdentifier: string,
                                       characteristicUUID: string,
                                       valueBase64: string,
                                       response: boolean,
                                       transactionId: string,
                                       resolve: Resolve<ble.BLECharacteristic>,
                                       reject: Reject) {
    var deviceId = this.getDeviceId(serviceIdentifier, characteristicUUID);
    if (deviceId == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.writeCharacteristicForDevice(deviceId, serviceIdentifier, characteristicUUID, valueBase64, response, transactionId, resolve, reject);
  }

  /**
   * @description Write value to characteristic.
   */
  public writeCharacteristic(characteristicIdentifier: string,
                             valueBase64: string,
                             response: boolean,
                             transactionId: string,
                             resolve: Resolve<ble.BLECharacteristic>,
                             reject: Reject) {
    const [deviceId, serviceIdentifier] = this.getDeviceIdAndServiceId(characteristicIdentifier)
    if (deviceId == null || serviceIdentifier == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.writeCharacteristicForDevice(deviceId, serviceIdentifier, characteristicIdentifier, valueBase64, response, transactionId, resolve, reject)
  }

  /**
   * @description Setup monitoring of characteristic value.
   */
  public monitorCharacteristicForDevice(deviceIdentifier: string,
                                        serviceUUID: string,
                                        characteristicUUID: string,
                                        transactionId: string,
                                        resolve: Resolve<ble.BLECharacteristic>,
                                        reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    let characteristic = this.discoveredCharacteristics.get(deviceIdentifier + '#' + serviceUUID + '#' + characteristicUUID);
    if (!characteristic) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    device.setCharacteristicChangeNotification(characteristic, true).then(value => {
      resolve(characteristic);
    }).catch(err => {
      Logger.debug(JSON.stringify(err));
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    });
  }

  /**
   * @description Setup monitoring of characteristic value.
   */
  public monitorCharacteristicForService(serviceIdentifier: string,
                                         characteristicUUID: string,
                                         transactionId: string,
                                         resolve: Resolve<ble.BLECharacteristic>,
                                         reject: Reject) {
    var deviceId = this.getDeviceId(serviceIdentifier, characteristicUUID);
    if (deviceId == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.monitorCharacteristicForDevice(deviceId, serviceIdentifier, characteristicUUID, transactionId, resolve, reject);
  }

  /**
   * @description Setup monitoring of characteristic value.
   */
  public monitorCharacteristic(characteristicIdentifier: string,
                               transactionId: string,
                               resolve: Resolve<ble.BLECharacteristic>,
                               reject: Reject) {
    const [deviceId, serviceIdentifier] = this.getDeviceIdAndServiceId(characteristicIdentifier);
    if (deviceId == null || serviceIdentifier == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.monitorCharacteristicForDevice(deviceId, serviceIdentifier, characteristicIdentifier, transactionId, resolve, reject);
  }


















  // Mark: Characteristics operations ------------------------------------------------------------------------------------

  /**
   * @description Read value to descriptor.
   */
  public readDescriptorForDevice(deviceId: string,
                                 serviceUUID: string,
                                 characteristicUUID: string,
                                 descriptorUUID: string,
                                 transactionId: string,
                                 resolve: Resolve<ble.BLEDescriptor>,
                                 reject: Reject) {
    let device = this.connectedDevices.get(deviceId);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    let characteristic = this.discoveredDescriptors.get(deviceId + '#' + serviceUUID + '#' + characteristicUUID + '#' + descriptorUUID);
    if (!characteristic) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }
    device.readDescriptorValue(characteristic).then(value => {
      resolve(value);
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    });
  }


  /**
   * @description Read value to descriptor.
   */
  public readDescriptorForService(serviceIdentifier: number, characteristicUUID: string, descriptorUUID: string, transactionId: string, resolve: Resolve<ble.BLEDescriptor>, reject: Reject) {
    var deviceId = this.getDeviceId(serviceIdentifier, characteristicUUID);
    if (deviceId == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.readDescriptorForDevice(deviceId, serviceIdentifier, descriptorUUID, characteristicUUID, transactionId, resolve, reject);
  }


  /**
   * @description Read value to descriptor.
   */
  public readDescriptorForCharacteristic(characteristicIdentifier: number, descriptorUUID: string, transactionId: string, resolve: Resolve<ble.BLEDescriptor>, reject: Reject) {
    const [deviceId, serviceIdentifier] = this.getDeviceIdAndServiceId(characteristicIdentifier)
    if (deviceId == null || serviceIdentifier == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.readDescriptorForDevice(deviceId, serviceIdentifier, descriptorUUID, characteristicIdentifier, transactionId, resolve, reject);
  }


  /**
   * @description Read value to descriptor.
   */
  public readDescriptor(descriptorIdentifier: number, descriptorUUID: string, transactionId: string, resolve: Resolve<ble.BLEDescriptor>, reject: Reject) {
    const [deviceId, serviceIdentifier] = this.getDeviceIdAndServiceId(characteristicIdentifier)
    if (deviceId == null || serviceIdentifier == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.readDescriptorForDevice(deviceId, serviceIdentifier, descriptorUUID, characteristicIdentifier, transactionId, resolve, reject);
  }


  /**
   * @description Read value to descriptor.
   */
  public writeDescriptorForDevice(deviceId: string, serviceUUID: string, characteristicUUID: string, descriptorUUID: string, valueBase64: string, transactionId: string, resolve: Resolve<ble.BLEDescriptor>, reject: Reject) {
    let device = this.connectedDevices.get(deviceId);
    if (!device) {
      reject(-1, 'The device is not connected.');
      return;
    }

    let descriptor: ble.BLEDescriptor = {
      serviceUuid: serviceUUID,
      characteristicUuid: characteristicUUID,
      descriptorUuid: descriptorUUID,
      descriptorValue: stringToArrayBuffer(valueBase64)
    };

    device.writeDescriptorValue(descriptor).then(() => {
      resolve(descriptor);
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      reject((err as BusinessError).code, (err as BusinessError).message, err);
    });

  }

  /**
   * @description Read value to descriptor.
   */
  public writeDescriptorForService(serviceIdentifier: number, characteristicUUID: string, descriptorUUID: string, valueBase64: string, transactionId: string, resolve: Resolve<ble.BLEDescriptor>, reject: Reject) {
    var deviceId = this.getDeviceId(serviceIdentifier, characteristicUUID);
    if (deviceId == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.writeDescriptorForDevice(deviceId, serviceIdentifier, characteristicUUID, descriptorUUID, valueBase64, transactionId, resolve, reject);

  }

  /**
   * @description Read value to descriptor.
   */
  public writeDescriptorForCharacteristic(characteristicIdentifier: number, descriptorUUID: string, valueBase64: string, transactionId: string, resolve: Resolve<ble.BLEDescriptor>, reject: Reject) {
    var deviceId = this.getDeviceId(serviceIdentifier, characteristicUUID);
    if (deviceId == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.writeDescriptorForDevice(deviceId, serviceIdentifier, characteristicUUID, descriptorUUID, valueBase64, transactionId, resolve, reject);

  }

  /**
   * @description Read value to descriptor.
   */
  public writeDescriptor(descriptorIdentifier: number, valueBase64: string, transactionId: string, resolve: Resolve<ble.BLEDescriptor>, reject: Reject) {
    var deviceId = this.getDeviceId(serviceIdentifier, characteristicUUID);
    if (deviceId == null) {
      reject(-1, 'Characteristics does not exist.');
      return;
    }

    this.writeDescriptorForDevice(deviceId, serviceIdentifier, characteristicUUID, descriptorUUID, valueBase64, transactionId, resolve, reject);

  }

  public addListener(eventName: string) {
    // Keep: Required for RN built in Event Emitter Calls.

  }

  public removeListeners(count: number) {
    // Keep: Required for RN built in Event Emitter Calls.

  }


  toJSMap(device: ble.GattClientDevice): Map<string, ValueType> {
    let result: Map<string, ValueType> = new Map<string, ValueType>();
    // result

    return result;
  }

  // Mark: Tools ------------------------------------------------------------------------------------

  // 获取deviceId
  private getDeviceId(serviceId: string, characteristicId: string): string {
    var deviceId: string = null;
    this.discoveredCharacteristics.forEach((value, key) => {
      if (key.indexOf(serviceId + '#' + characteristicId) != -1) {
        let keyList = key.split('#');
        if (keyList.length > 0) {
          deviceId = keyList[0];
        }
      }
    });
    return deviceId;
  }

  // 获取deviceId和serviceId
  private getDeviceIdAndServiceId(characteristicId: string): [string, string] {
    var deviceId: string = null;
    var serviceId: string = null;
    this.discoveredCharacteristics.forEach((value, key) => {
      if (key.indexOf(characteristicId) != -1) {
        let keyList = key.split('#');
        if (keyList.length > 1) {
          deviceId = keyList[0];
          serviceId = keyList[1];
        }
      }
    });
    return [deviceId, serviceId];
  }
}

function value(value: string, index: number, array: string[]): void {
  throw new Error('Function not implemented.');
}
