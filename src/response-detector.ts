import { Detector, DetectorOptions } from './detector';
import { IncomingMessage } from 'http';

export class ResponseDetector extends Detector<IncomingMessage> {
  constructor(options: DetectorOptions) {
    super();

    this.requestObserver = options.requestObserver;
    this.handlersList = [
      {
        name: 'error',
        handler: (): void => this.requestObserver.detectEvent('error')
      },
      {
        name: 'end',
        handler: (): void => this.requestObserver.detectEvent('end')
      }
    ];
  }

  protected subscribeInit(): void {
    this.requestObserver.detectEvent('response');
  }
}
