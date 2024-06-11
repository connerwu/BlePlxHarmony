import ble from '@ohos.bluetooth.ble';
import access from '@ohos.bluetooth.access';
import { BusinessError } from '@ohos.base';
import Logger from './Logger'
import { ValuesBucket, ValueType } from '@kit.ArkData';
import { Resolve, Reject, stringToArrayBuffer, scanResultToJsObjectConverter } from './BleUtils'
import { constant } from '@kit.ConnectivityKit';
import { JSON } from '@kit.ArkTS';
import { BleErrorToJsObjectConverter } from './BleErrorToJsObjectConverter';
import { Service } from './Service';
import { Characteristic } from './Characteristic';
import { Descriptor } from './Descriptor';
import { ServiceFactory } from './utils/ServiceFactory';
import { Device } from './Device';
import { BleError,BleErrorCode } from './errors/BleError';
// import { RNInstance } from '../../../RNOH/ts';

export class BleClientManager {
  // 连接的设备
  private connectedDevices: Map<string, Device> = new Map();

  // Services
  private discoveredServices: Map<number, Service> = new Map();

  // Characteristics
  private discoveredCharacteristics: Map<number, Characteristic> = new Map();

  // Descriptors
  private discoveredDescriptors: Map<number, Descriptor> = new Map();

  private errorConverter:BleErrorToJsObjectConverter = new BleErrorToJsObjectConverter();

  public invalidate() {
    this.connectedDevices.clear();
    this.discoveredServices.clear();
    this.discoveredCharacteristics.clear();
    this.discoveredDescriptors.clear();
  }

  public dispatchEvent(name: string, value: ValuesBucket) {
    Logger.debug('Event name: ' + name, ', value: ' + JSON.stringify(value));
    // TODO: RN Event
    // this.sendEvent(name, value);
  }

  public enable(transactionId: string, resolve: Resolve<Object>, reject: Reject) {
    try {
      access.enableBluetooth();
      resolve(null);
    } catch (e) {
      let bleError = new BleError(BleErrorCode.BluetoothUnsupported,e.message);
      reject(e.code, this.errorConverter.toJs(bleError));
    }
  }

  public disable(transactionId: string, resolve: Resolve<Object>, reject: Reject) {
    try {
      access.disableBluetooth();
      resolve(null);
    } catch (e) {
      let bleError = new BleError(BleErrorCode.BluetoothPoweredOff,e.message);
      reject(e.code, this.errorConverter.toJs(bleError));
    }
  }

  public state(resolve: Resolve<Object>, reject: Reject) {
    var result: string = 'Unknown';
    let state = access.getState();
    switch (state) {
      case access.BluetoothState.STATE_OFF:
        result = 'PoweredOff';
        break;
      case access.BluetoothState.STATE_ON:
      case access.BluetoothState.STATE_BLE_ON:
        result = 'PoweredOn';
        break;
      case access.BluetoothState.STATE_TURNING_ON:
      case access.BluetoothState.STATE_TURNING_OFF:
      case access.BluetoothState.STATE_BLE_TURNING_ON:
      case access.BluetoothState.STATE_BLE_TURNING_OFF:
        result = 'Resetting';
        break;
    }
    resolve(result)
  }

  public setLogLevel(logLevel:string):void{

  }

  public logLevel(resolve: Resolve<Object>, reject: Reject): void {

  }

  public cancelTransaction(transactionId:string): void {

  }


  // Mark: Scanning ------------------------------------------------------------------------------------------------------

  /**
   * @description 开始蓝牙扫描
   * @param filteredUUIDs: Array<string>
   * @param options: Map<string, number>
   */
  public startDeviceScan(filteredUUIDs?: Array<string>,
                         options?: Map<string, number>,
                         resolve?: Resolve<ValuesBucket>,
                         reject?: Reject) {
    try {
      ble.on("BLEDeviceFind", (data: Array<ble.ScanResult>) => {
        Logger.debug('BLE scan device find result = ' + JSON.stringify(data));
        let result = scanResultToJsObjectConverter(data[0]);
        resolve?.(result);
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
                                            resolve: Resolve<Device>,
                                            reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier;
      reject(-1, this.errorConverter.toJs(bleError));
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
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    device.clientDevice.getRssiValue((err: BusinessError, data: number) => {
      console.info('rssi err ' + JSON.stringify(err));
      console.info('rssi value' + JSON.stringify(data));
      if (err == null) {
        resolve(data);
      } else {
        let bleError = new BleError(BleErrorCode.DeviceRSSIReadFailed,err.message,null);
        bleError.deviceID = deviceIdentifier
        reject(err.code, this.errorConverter.toJs(bleError));
      }
    })
  }

  /**
   * @description 请求MTU
   */
  public requestMTUForDevice(deviceIdentifier: string,
                             mtu: number,
                             transactionId: string,
                             resolve: Resolve<Device>,
                             reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      reject(-1, this.errorConverter.toJs(bleError));
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
      device.getDeviceName().then(value => {
        device.on('BLEConnectionStateChange', (state: ble.BLEConnectionChangeState) => {
          Logger.debug('bluetooth connect state changed: ' + state.state);
          if (state.state == constant.ProfileConnectionState.STATE_CONNECTED) {
            let client = new Device(deviceIdentifier, value)
            client.clientDevice = device;
            this.connectedDevices.set(deviceIdentifier, client);
          } else {
            this.connectedDevices.delete(deviceIdentifier);
          }
          resolve(state.state);
        });
        device.connect();
      }).catch(err => {
        Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
        let bleError = new BleError(BleErrorCode.DeviceConnectionFailed,err.message,null);
        bleError.deviceID = deviceIdentifier
        reject(err.code, this.errorConverter.toJs(bleError));
      })
    } catch (err) {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.DeviceNotFound,err.message,null);
      bleError.deviceID = deviceIdentifier
      reject(err.code, this.errorConverter.toJs(bleError));
    }
  }

  /**
   * @description client端断开与远端蓝牙低功耗设备的连接
   */
  public cancelDeviceConnection(deviceIdentifier: string, resolve: Resolve<ble.GattClientDevice>, reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    try {
      device.clientDevice.disconnect();
      resolve(device.clientDevice);
    } catch (err) {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.DeviceNotConnected,err.message,null);
      bleError.deviceID = deviceIdentifier
      reject(err.code, this.errorConverter.toJs(bleError));
    }
  }

  /**
   * @description 设备是否已连接
   */
  public isDeviceConnected(deviceIdentifier: string, resolve: Resolve<boolean>, reject: Reject) {
    try {
      let device = this.connectedDevices.get(deviceIdentifier);

      if (device) {
        resolve(true);
      } else {
        let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not founded.',null);
        bleError.deviceID = deviceIdentifier
        reject(-1, this.errorConverter.toJs(bleError));
      }
    } catch (e) {
      let bleError = new BleError(BleErrorCode.DeviceNotConnected,e.message,null);
      bleError.deviceID = deviceIdentifier
      reject(-1, this.errorConverter.toJs(bleError));
    }

  }

  // Mark: Discovery -----------------------------------------------------------------------------------------------------

  /**
   * @description 获取设备的服务和特征
   */
  public discoverAllServicesAndCharacteristicsForDevice(deviceIdentifier: string,
                                                        transactionId: string,
                                                        resolve: Resolve<Device>,
                                                        reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    device.clientDevice.getServices().then(services => {
      let factory = new ServiceFactory();
      var newServiceList: Service[] = [];
      // services
      services.forEach(service => {
        Logger.debug('serviceUuid： ' + service.serviceUuid);
        let newService = factory.create(deviceIdentifier, service);
        this.discoveredServices.set(newService.getId(), newService);
        newServiceList.push(newService);

        // characteristics
        newService.getCharacteristics().forEach(characteristic => {
          Logger.debug('characteristicUuid： ' + characteristic.getUuid());
          this.discoveredCharacteristics.set(characteristic.getId(), characteristic);

          // descriptors
          characteristic.getDescriptors().forEach(descriptor => {
            Logger.debug('serviceUuid： ' + service.serviceUuid);
            Logger.debug('characteristicUuid： ' + characteristic.getUuid());
            Logger.debug('descriptorUuid： ' + descriptor.getUuid());
            this.discoveredDescriptors.set(descriptor.getId(), descriptor);
          })
        })
      })
      device.setServices(newServiceList);
      resolve(device);
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.ServicesDiscoveryFailed,err.message,null);
      bleError.deviceID = deviceIdentifier
      reject(err.code, this.errorConverter.toJs(bleError));
    });
  }

  // Mark: Service and characteristic getters ----------------------------------------------------------------------------

  /**
   * @description List of discovered services for specified device.
   */
  public servicesForDevice(deviceIdentifier: string, resolve: Resolve<Array<ValuesBucket>>, reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let services = device.getServices();
    var results = new Array<ValuesBucket>();
    services.forEach(obj => {
      results.push(obj.asJSObject());
    });
    resolve(results);
  }

  /**
   * @description List of discovered {@link Characteristic}s for given {@link Device} and {@link Service}.
   */
  public characteristicsForDevice(deviceIdentifier: string,
                                  serviceUUID: string,
                                  resolve: Resolve<Array<ValuesBucket>>,
                                  reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    var characteristic = device.getServiceByUUID(serviceUUID);
    let services = characteristic.getCharacteristics();
    var results = new Array<ValuesBucket>();
    services.forEach(obj => {
      results.push(obj.asJSObject());
    });
    resolve(results);
  }

  /**
   * @description List of discovered {@link Descriptor}s for given {@link Device}, {@link Service} and {@link Characteristic}.
   */
  public descriptorsForDevice(deviceIdentifier: string,
                              serviceUUID: string,
                              characteristicUUID: string,
                              resolve: Resolve<Array<ValuesBucket>>,
                              reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let service = device.getServiceByUUID(serviceUUID);
    if (service == null) {
      let bleError = new BleError(BleErrorCode.ServiceNotFound,'The service does not exist..',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let characteristic = service.getCharacteristicByUUID(characteristicUUID)
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let descriptors = characteristic.getDescriptors();
    var results = new Array<ValuesBucket>();
    descriptors.forEach(obj => {
      results.push(obj.asJSObject());
    });
    resolve(results);
  }

  /**
   * @description List of discovered descriptors for specified service.
   */
  public descriptorsForService(serviceIdentifier: number,
                               characteristicUUID: string,
                               resolve: Resolve<Array<ValuesBucket>>,
                               reject: Reject) {
    let service = this.discoveredServices.get(serviceIdentifier);
    if (service == null) {
      let bleError = new BleError(BleErrorCode.ServiceNotFound,'The service does not exist.',null);
      bleError.serviceUUID = serviceIdentifier.toString()
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let characteristic = service.getCharacteristicByUUID(characteristicUUID);
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.serviceUUID = serviceIdentifier.toString()
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let descriptors = characteristic.getDescriptors();
    var results = new Array<ValuesBucket>();
    descriptors.forEach(obj => {
      results.push(obj.asJSObject());
    });
    resolve(results);
  }

  /**
   * @description List of discovered descriptors for specified characteristic.
   */
  public descriptorsForCharacteristic(characteristicIdentifier: number,
                                      resolve: Resolve<Array<ValuesBucket>>,
                                      reject: Reject) {
    let characteristic = this.discoveredCharacteristics.get(characteristicIdentifier);
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.characteristicUUID = characteristicIdentifier.toString()
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let descriptors = characteristic.getDescriptors();
    var results = new Array<ValuesBucket>();
    descriptors.forEach(obj => {
      results.push(obj.asJSObject());
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
                                     resolve: Resolve<ValuesBucket>,
                                     reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let characteristic = this.getCharacteristicOrEmitErrorWithDeviceId(deviceIdentifier, serviceUUID, characteristicUUID);
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    device.clientDevice.readCharacteristicValue(characteristic.gattCharacteristic).then(value => {
      characteristic.setValue(value.characteristicValue);
      let newChar = Characteristic.constructorWithOther(characteristic);
      resolve(newChar.asJSObject());
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.CharacteristicReadFailed,err.message,null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(err.code, this.errorConverter.toJs(bleError));
    });
  }

  /**
   * @description Read characteristic's value.
   */
  public readCharacteristicForService(serviceIdentifier: number,
                                      characteristicUUID: string,
                                      transactionId: string,
                                      resolve: Resolve<ValuesBucket>,
                                      reject: Reject) {
    let characteristic = this.getCharacteristicOrEmitErrorWithServiceId(serviceIdentifier, characteristicUUID);
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.serviceUUID = serviceIdentifier.toString()
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.readCharacteristicForDevice(characteristic.getDeviceId(), characteristic.getServiceUUID(), characteristicUUID, transactionId, resolve, reject);
  }

  /**
   * @description Read characteristic's value.
   */
  public readCharacteristic(characteristicIdentifier: number,
                            transactionId: string,
                            resolve: Resolve<ValuesBucket>,
                            reject: Reject) {
    let characteristic = this.getCharacteristicOrEmitErrorWithCharId(characteristicIdentifier)
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.characteristicUUID = characteristicIdentifier.toString()
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.readCharacteristicForDevice(characteristic.getDeviceId(), characteristic.getServiceUUID(), characteristic.getUuid(), transactionId, resolve, reject);
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
                                      resolve: Resolve<ValuesBucket>,
                                      reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let characteristic = this.getCharacteristicOrEmitErrorWithDeviceId(deviceIdentifier, serviceUUID, characteristicUUID);
    if (!characteristic) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    characteristic.gattCharacteristic.characteristicValue = stringToArrayBuffer(valueBase64);

    device.clientDevice.writeCharacteristicValue(characteristic.gattCharacteristic, response ? ble.GattWriteType.WRITE : ble.GattWriteType.WRITE_NO_RESPONSE).then(value => {
      Logger.debug('Write characteristic: ' + JSON.stringify(characteristic), +' value: ' + valueBase64);
      characteristic.setValue(stringToArrayBuffer(valueBase64));
      let newChar = Characteristic.constructorWithOther(characteristic);
      resolve(newChar.asJSObject());
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.CharacteristicWriteFailed,err.message,null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(err.code, this.errorConverter.toJs(bleError));
    });
  }

  /**
   * @description Write value to characteristic.
   */
  public writeCharacteristicForService(serviceIdentifier: number,
                                       characteristicUUID: string,
                                       valueBase64: string,
                                       response: boolean,
                                       transactionId: string,
                                       resolve: Resolve<ValuesBucket>,
                                       reject: Reject) {
    let characteristic = this.getCharacteristicOrEmitErrorWithServiceId(serviceIdentifier, characteristicUUID);
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.serviceUUID = serviceIdentifier.toString()
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.writeCharacteristicForDevice(characteristic.getDeviceId(), characteristic.getServiceUUID(), characteristicUUID, valueBase64, response, transactionId, resolve, reject);
  }

  /**
   * @description Write value to characteristic.
   */
  public writeCharacteristic(characteristicIdentifier: number,
                             valueBase64: string,
                             response: boolean,
                             transactionId: string,
                             resolve: Resolve<ValuesBucket>,
                             reject: Reject) {
    let characteristic = this.getCharacteristicOrEmitErrorWithCharId(characteristicIdentifier)
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.characteristicUUID = characteristicIdentifier.toString()
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.writeCharacteristicForDevice(characteristic.getDeviceId(), characteristic.getServiceUUID(), characteristic.getUuid(), valueBase64, response, transactionId, resolve, reject);
  }

  /**
   * @description Setup monitoring of characteristic value.
   */
  public monitorCharacteristicForDevice(deviceIdentifier: string,
                                        serviceUUID: string,
                                        characteristicUUID: string,
                                        transactionId: string,
                                        resolve: Resolve<ValuesBucket>,
                                        reject: Reject) {
    let device = this.connectedDevices.get(deviceIdentifier);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let characteristic = this.getCharacteristicOrEmitErrorWithDeviceId(deviceIdentifier, serviceUUID, characteristicUUID);
    if (!characteristic) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    device.clientDevice.setCharacteristicChangeNotification(characteristic.gattCharacteristic, true).then(value => {
      resolve(characteristic.asJSObject());
    }).catch(err => {
      Logger.debug(JSON.stringify(err));
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.CharacteristicNotifyChangeFailed,err.message,null);
      bleError.deviceID = deviceIdentifier
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      reject(err.code, this.errorConverter.toJs(bleError));
    });
  }

  /**
   * @description Setup monitoring of characteristic value.
   */
  public monitorCharacteristicForService(serviceIdentifier: number,
                                         characteristicUUID: string,
                                         transactionId: string,
                                         resolve: Resolve<ValuesBucket>,
                                         reject: Reject) {
    let characteristic = this.getCharacteristicOrEmitErrorWithServiceId(serviceIdentifier, characteristicUUID);
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.serviceUUID = serviceIdentifier.toString()
      bleError.characteristicUUID = characteristicUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.monitorCharacteristicForDevice(characteristic.getDeviceId(), characteristic.getServiceUUID(), characteristicUUID, transactionId, resolve, reject);
  }

  /**
   * @description Setup monitoring of characteristic value.
   */
  public monitorCharacteristic(characteristicIdentifier: number,
                               transactionId: string,
                               resolve: Resolve<ValuesBucket>,
                               reject: Reject) {
    let characteristic = this.getCharacteristicOrEmitErrorWithCharId(characteristicIdentifier)
    if (characteristic == null) {
      let bleError = new BleError(BleErrorCode.CharacteristicNotFound,'The characteristic does not exist.',null);
      bleError.characteristicUUID = characteristicIdentifier.toString()
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.monitorCharacteristicForDevice(characteristic.getDeviceId(), characteristic.getServiceUUID(), characteristic.getUuid(), transactionId, resolve, reject);
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
                                 resolve: Resolve<ValuesBucket>,
                                 reject: Reject) {
    let device = this.connectedDevices.get(deviceId);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceId
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let descriptor = this.getDescriptorWithDeviceId(deviceId, serviceUUID, characteristicUUID, descriptorUUID);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.deviceID = deviceId
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    device.clientDevice.readDescriptorValue(descriptor.getNativeDescriptor()).then(value => {
      descriptor.setValue(value.descriptorValue);
      let newDes = Descriptor.constructorWithOther(descriptor);
      resolve(newDes.asJSObject());
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.DescriptorReadFailed,err.message,null);
      bleError.deviceID = deviceId
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(err.code, this.errorConverter.toJs(bleError));
    });
  }

  /**
   * @description Read value to descriptor.
   */
  public readDescriptorForService(serviceIdentifier: number,
                                  characteristicUUID: string,
                                  descriptorUUID: string,
                                  transactionId: string,
                                  resolve: Resolve<ValuesBucket>,
                                  reject: Reject) {
    let descriptor = this.getDescriptorWithServiceId(serviceIdentifier, characteristicUUID, descriptorUUID);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.serviceUUID = serviceIdentifier.toString()
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.readDescriptorForDevice(descriptor.getDeviceId(), descriptor.getServiceUuid(), descriptorUUID, characteristicUUID, transactionId, resolve, reject);
  }


  /**
   * @description Read value to descriptor.
   */
  public readDescriptorForCharacteristic(characteristicIdentifier: number,
                                         descriptorUUID: string,
                                         transactionId: string,
                                         resolve: Resolve<ValuesBucket>,
                                         reject: Reject) {
    let descriptor = this.getDescriptorWithCharId(characteristicIdentifier, descriptorUUID);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.characteristicUUID = characteristicIdentifier.toString()
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.readDescriptorForDevice(descriptor.getDeviceId(), descriptor.getServiceUuid(), descriptorUUID, descriptor.getCharacteristicUuid(), transactionId, resolve, reject);
  }

  /**
   * @description Read value to descriptor.
   */
  public readDescriptor(descriptorIdentifier: number,
                        descriptorUUID: string,
                        transactionId: string,
                        resolve: Resolve<ValuesBucket>,
                        reject: Reject) {
    let descriptor = this.discoveredDescriptors.get(descriptorIdentifier);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.readDescriptorForDevice(descriptor.getDeviceId(), descriptor.getServiceUuid(), descriptorUUID, descriptor.getCharacteristicUuid(), transactionId, resolve, reject);
  }

  /**
   * @description Read value to descriptor.
   */
  public writeDescriptorForDevice(deviceId: string,
                                  serviceUUID: string,
                                  characteristicUUID: string,
                                  descriptorUUID: string,
                                  valueBase64: string,
                                  transactionId: string,
                                  resolve: Resolve<ValuesBucket>,
                                  reject: Reject) {
    let device = this.connectedDevices.get(deviceId);
    if (!device) {
      let bleError = new BleError(BleErrorCode.DeviceNotFound,'The device is not connected.',null);
      bleError.deviceID = deviceId
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    let descriptor = this.getDescriptorWithDeviceId(deviceId, serviceUUID, characteristicUUID, descriptorUUID);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.deviceID = deviceId
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    descriptor.getNativeDescriptor().descriptorValue = stringToArrayBuffer(valueBase64);

    device.clientDevice.writeDescriptorValue(descriptor.getNativeDescriptor()).then(value => {
      descriptor.setValue(descriptor.getNativeDescriptor().descriptorValue);
      let newDesc = Descriptor.constructorWithOther(descriptor)
      resolve(newDesc.asJSObject());
    }).catch(err => {
      Logger.debug('errCode: ' + (err as BusinessError).code + ', errMessage: ' + (err as BusinessError).message);
      let bleError = new BleError(BleErrorCode.DescriptorWriteFailed,err.message,null);
      bleError.deviceID = deviceId
      bleError.serviceUUID = serviceUUID
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(err.code, this.errorConverter.toJs(bleError));
    });
  }

  /**
   * @description Read value to descriptor.
   */
  public writeDescriptorForService(serviceIdentifier: number,
                                   characteristicUUID: string,
                                   descriptorUUID: string,
                                   valueBase64: string,
                                   transactionId: string,
                                   resolve: Resolve<ValuesBucket>,
                                   reject: Reject) {
    let descriptor = this.getDescriptorWithServiceId(serviceIdentifier, characteristicUUID, descriptorUUID);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.serviceUUID = serviceIdentifier.toString()
      bleError.characteristicUUID = characteristicUUID
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.writeDescriptorForDevice(descriptor.getDeviceId(), descriptor.getServiceUuid(), characteristicUUID, descriptorUUID, valueBase64, transactionId, resolve, reject);
  }

  /**
   * @description Read value to descriptor.
   */
  public writeDescriptorForCharacteristic(characteristicIdentifier: number,
                                          descriptorUUID: string,
                                          valueBase64: string,
                                          transactionId: string,
                                          resolve: Resolve<ValuesBucket>,
                                          reject: Reject) {
    let descriptor = this.getDescriptorWithCharId(characteristicIdentifier, descriptorUUID);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.characteristicUUID = characteristicIdentifier.toString()
      bleError.descriptorUUID = descriptorUUID
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.writeDescriptorForDevice(descriptor.getDeviceId(), descriptor.getServiceUuid(), descriptor.getCharacteristicUuid(), descriptorUUID, valueBase64, transactionId, resolve, reject);
  }

  /**
   * @description Read value to descriptor.
   */
  public writeDescriptor(descriptorIdentifier: number,
                         valueBase64: string,
                         transactionId: string,
                         resolve: Resolve<ValuesBucket>,
                         reject: Reject) {
    let descriptor = this.discoveredDescriptors.get(descriptorIdentifier);
    if (descriptor == null) {
      let bleError = new BleError(BleErrorCode.DescriptorNotFound,'The descriptor does not exist.',null);
      bleError.descriptorUUID = descriptorIdentifier.toString()
      reject(-1, this.errorConverter.toJs(bleError));
      return;
    }

    this.writeDescriptorForDevice(descriptor.getDeviceId(), descriptor.getServiceUuid(), descriptor.getCharacteristicUuid(), descriptor.getUuid(), valueBase64, transactionId, resolve, reject);
  }

  public addListener(eventName: string) {
    // Keep: Required for RN built in Event Emitter Calls.

  }

  public removeListeners(count: number) {
    // Keep: Required for RN built in Event Emitter Calls.

  }

  // Mark: Tools ------------------------------------------------------------------------------------

  private getCharacteristicOrEmitErrorWithCharId(characteristicIdentifier: number): Characteristic | null {
    let characteristic = this.discoveredCharacteristics.get(characteristicIdentifier);
    return characteristic;
  }

  private getCharacteristicOrEmitErrorWithServiceId(serviceIdentifier: number, characteristicUUID: string): Characteristic | null {
    let service = this.discoveredServices.get(serviceIdentifier);
    if (service == null) {
      return null;
    }

    let characteristic = service.getCharacteristicByUUID(characteristicUUID);
    return characteristic;
  }

  private getCharacteristicOrEmitErrorWithDeviceId(deviceId: string, serviceUUID: string, characteristicUUID: string): Characteristic | null {
    let device = this.connectedDevices.get(deviceId);
    if (device == null) {
      return null;
    }

    let service = device.getServiceByUUID(serviceUUID);
    if (service == null) {
      return null;
    }

    let characteristic = service.getCharacteristicByUUID(characteristicUUID);
    if (characteristic == null) {
      return null;
    }

    return characteristic;
  }

  private getDescriptorWithCharId(characteristicIdentifier: number, descriptorUUID: string): Descriptor | null {
    let characteristic = this.discoveredCharacteristics.get(characteristicIdentifier);
    if (characteristic == null) {
      return null;
    }

    let descriptor = characteristic.getDescriptorByUUID(descriptorUUID);
    if (descriptor == null) {
      return null;
    }

    return descriptor;
  }

  private getDescriptorWithServiceId(serviceIdentifier: number, characteristicUUID: string, descriptorUUID: string): Descriptor | null {
    let service = this.discoveredServices.get(serviceIdentifier);
    if (service == null) {
      return null;
    }

    let characteristic = service.getCharacteristicByUUID(characteristicUUID);
    if (characteristic == null) {
      return null;
    }

    let descriptor = characteristic.getDescriptorByUUID(descriptorUUID);
    if (descriptor == null) {
      return null;
    }

    return descriptor;
  }

  private getDescriptorWithDeviceId(deviceId: string, serviceUUID: string, characteristicUUID: string, descriptorUUID: string): Descriptor | null {
    let device = this.connectedDevices.get(deviceId);
    if (device == null) {
      return null;
    }

    let service = device.getServiceByUUID(serviceUUID);
    if (service == null) {
      return null;
    }

    let characteristic = service.getCharacteristicByUUID(characteristicUUID);
    if (characteristic == null) {
      return null;
    }

    let descriptor = characteristic.getDescriptorByUUID(descriptorUUID);
    if (descriptor == null) {
      return null;
    }

    return descriptor;
  }
}
