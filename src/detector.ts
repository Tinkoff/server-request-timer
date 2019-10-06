import { EventEmitter } from 'events';
import { RequestObserver } from './request-observer';
import { SourceTimings } from './request-timer';

export type DetectorOptions = {
  requestObserver: RequestObserver;
};

export type EventHandler = {
  name: keyof SourceTimings;
  handler: (emitter?: EventEmitter) => void;
};

export abstract class Detector<T extends EventEmitter = EventEmitter> {
  protected requestObserver: RequestObserver;
  protected emitter?: T;
  protected handlersList: EventHandler[] = [];

  public subscribe(emitter: T): void {
    this.emitter = emitter;
    this.subscribeInit();

    this.handlersList.forEach((handler: EventHandler): void => {
      emitter.once(handler.name, handler.handler);
    });
  }

  public unSubscribe(): void {
    const emitter = this.emitter;

    if (emitter) {
      this.handlersList.forEach((handler: EventHandler): void => {
        emitter.removeListener(handler.name, handler.handler);
      });
    }
  }

  protected abstract subscribeInit(): void;
}
