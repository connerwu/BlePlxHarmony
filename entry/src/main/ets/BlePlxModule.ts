import { BleClientManager } from './BleModule'
import { Resolve, Reject, stringToArrayBuffer } from './BleUtils'

export class BlePlxModule {
  private manager: BleClientManager;

  public createClient(restoreStateIdentifier: string) {
    this.manager = new BleClientManager();
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


}