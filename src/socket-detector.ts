import { Detector, DetectorOptions } from './detector';
import { Socket } from 'net';

export class SocketDetector extends Detector<Socket> {
  constructor(options: DetectorOptions) {
    super();

    this.requestObserver = options.requestObserver;
    this.connectHandler = (): void => this.requestObserver.detectEvent('connect');
    this.handlersList = [
      {
        name: 'error',
        handler: (): void => this.requestObserver.detectEvent('error')
      },
      {
        name: 'connect',
        handler: this.connectHandler
      },
      {
        name: 'lookup',
        handler: (): void => this.requestObserver.detectEvent('lookup')
      }
    ];
  }
  private connectHandler: () => void;

  public subscribeInit(): void {
    this.requestObserver.detectEvent('socket');

    if (this.emitter && this.emitter.writable && !this.emitter.connecting) {
      this.connectHandler();
    }
  }
}
