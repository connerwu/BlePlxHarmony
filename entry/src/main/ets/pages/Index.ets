import access from '@ohos.bluetooth.access';
import ble from '@ohos.bluetooth.ble';
import Logger from '../Logger'
import { BleClientManager } from '../BleModule'
import { constant } from '@kit.ConnectivityKit';
import json from '@ohos.util.json';

@Entry
@Component
struct Index {
  @State message: string = 'Hello World';

  manager: BleClientManager = new BleClientManager();

  build() {
    Row() {
      Column() {
        Text(this.message)
          .fontSize(50)
          .fontWeight(FontWeight.Bold)
      }
      .width('100%')
    }
    .height('100%')
  }

  onPageShow(): void {
    // 开启蓝牙
    // access.enableBluetooth();
    // access.on('stateChange', (data) => {
    //   let btStateMessage = '';
    //   switch (data) {
    //     case 0:
    //       btStateMessage += 'STATE_OFF';
    //       break;
    //     case 1:
    //       btStateMessage += 'STATE_TURNING_ON';
    //       break;
    //     case 2:
    //       btStateMessage += 'STATE_ON';
    //       break;
    //     case 3:
    //       btStateMessage += 'STATE_TURNING_OFF';
    //       break;
    //     case 4:
    //       btStateMessage += 'STATE_BLE_TURNING_ON';
    //       break;
    //     case 5:
    //       btStateMessage += 'STATE_BLE_ON';
    //       break;
    //     case 6:
    //       btStateMessage += 'STATE_BLE_TURNING_OFF';
    //       break;
    //     default:
    //       btStateMessage += 'unknown status';
    //       break;
    //   }
    //   Logger.debug('bluetooth statues: ' + btStateMessage);
    // })

    // 扫描
    this.manager.startDeviceScan(null, null, (device => {
      Logger.debug('发现设备：'+ device!['name']);
        if (device!['name'] == 'iGS620') {
          this.manager.stopDeviceScan();
          this.connectToDevice(device!['id'] as string);
        }
    }), null);
  }

  // 连接
  connectToDevice(deviceId: string) {
    this.manager.connectToDevice(deviceId, null, (value) => {
      Logger.debug('连接完成');
      if (value == constant.ProfileConnectionState.STATE_CONNECTED) {
        Logger.debug('连接成功');
        this.testFunctionsAfterConnected(deviceId);
      } else {
        Logger.debug('连接状态:' + value);
      }
    }, () => {
      Logger.debug('连接失败');
    })
  }

  testFunctionsAfterConnected(deviceId: string) {
    // 断开连接
    // this.manager.cancelDeviceConnection(deviceId, null, null);

    // this.manager.isDeviceConnected(deviceId, (value) => {
    //   Logger.debug('isDeviceConnected:' + value);
    // }, null);

    // this.manager.requestConnectionPriorityForDevice(deviceId, 0, null, (value) => {
    //   Logger.debug('requestConnectionPriorityForDevice:' + value);
    // }, null);

    this.manager.discoverAllServicesAndCharacteristicsForDevice(deviceId, null, (value) => {
      Logger.debug('222');
      this.testFunctionsAfterDiscovered(deviceId)
    }, () => {
      // Logger.debug('333');
      // this.testFunctionsAfterDiscovered(deviceId)
    });

    // this.manager.readRSSIForDevice(deviceId, null, (value) => {
    //   Logger.debug('readRSSIForDevice:' + value);
    // }, null);
  }

  testFunctionsAfterDiscovered(deviceId: string) {
    // this.manager.servicesForDevice(deviceId, (value) => {
    //   Logger.debug('servicesForDevice:' + value);
    // }, null);

    // this.manager.characteristicsForDevice(deviceId, '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', (value) => {
    //   Logger.debug('characteristicsForDevice:' + value);
    // }, null);

    // this.manager.descriptorsForDevice(deviceId, '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E', (value) => {
    //   Logger.debug('descriptorsForDevice:' + value);
    // }, null);

    // this.manager.descriptorsForService('6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E', (value) => {
    //   Logger.debug('descriptorsForService:' + value);
    // }, null);

    // this.manager.descriptorsForCharacteristic('6E400003-B5A3-F393-E0A9-E50E24DCCA9E', (value) => {
    //   Logger.debug('descriptorsForCharacteristic:' + value);
    // }, null);

    // this.manager.readCharacteristicForDevice(deviceId, '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E', null, (value) => {
    //   Logger.debug('readCharacteristicForDevice:' + JSON.stringify(value));
    // }, null);

    // this.manager.readCharacteristicForService('6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E', null, (value) => {
    //   Logger.debug('readCharacteristicForService:' + JSON.stringify(value));
    // }, null);

    // this.manager.readCharacteristic('6E400003-B5A3-F393-E0A9-E50E24DCCA9E', null, (value) => {
    //   Logger.debug('readCharacteristic:' + JSON.stringify(value));
    // }, null);

    // this.manager.writeCharacteristicForDevice(deviceId, '6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E', '123', true, null, (value) => {
    //   Logger.debug('writeCharacteristicForDevice:' + JSON.stringify(value));
    // }, null);

    // this.manager.writeCharacteristicForService('6E400001-B5A3-F393-E0A9-E50E24DCCA9E', '6E400003-B5A3-F393-E0A9-E50E24DCCA9E', '123', true, null, (value) => {
    //   Logger.debug('writeCharacteristicForService:' + JSON.stringify(value));
    // }, null);

    // this.manager.writeCharacteristic('6E400003-B5A3-F393-E0A9-E50E24DCCA9E', '123', true, null, (value) => {
    //   Logger.debug('writeCharacteristic:' + JSON.stringify(value));
    // }, null);

    this.manager.monitorCharacteristicForDevice(deviceId, '6E400001-B5A3-F393-E0A9-E50E24DCCA8E', '6E400003-B5A3-F393-E0A9-E50E24DCCA8E', null, (value) => {
      Logger.debug('monitorCharacteristicForDevice:' + JSON.stringify(value));
    }, null);




  }
}