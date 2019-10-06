import { Detector, DetectorOptions } from './detector';
import { ClientRequest, IncomingMessage } from 'http';
import { Socket } from 'net';
import { SocketDetector } from './socket-detector';
import { ResponseDetector } from './response-detector';

interface RequestDetectorOptions extends DetectorOptions {
  socketDetector: SocketDetector;
  responseDetector: ResponseDetector;
}

export class RequestDetector extends Detector<ClientRequest> {
  constructor(options: RequestDetectorOptions) {
    super();

    this.socketDetector = options.socketDetector;
    this.responseDetector = options.responseDetector;
    this.requestObserver = options.requestObserver;

    this.handlersList = [
      {
        name: 'socket',
        handler: (socket: Socket): void => this.socketDetector.subscribe(socket)
      },
      {
        name: 'finish',
        handler: (): void => this.requestObserver.detectEvent('finish')
      },
      {
        name: 'response',
        handler: (response: IncomingMessage): void => this.responseDetector.subscribe(response)
      },
      {
        name: 'error',
        handler: (): void => this.requestObserver.detectEvent('error')
      }
    ];
  }

  private socketDetector: SocketDetector;
  private responseDetector: ResponseDetector;

  protected subscribeInit(): void {
    this.requestObserver.detectEvent('request');
  }
}
