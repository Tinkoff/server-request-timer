import { EventEmitter } from 'events';
import { SourceTimings } from './request-timer';

const EVENT_NAME = 'requestEvent';

export class RequestObserver {
  constructor() {
    this.emitter = new EventEmitter();
  }

  private emitter: EventEmitter;

  public onDetectedEvent(handler: (event: keyof SourceTimings) => void): void {
    this.emitter.on(EVENT_NAME, handler);
  }

  public detectEvent(event: keyof SourceTimings): void {
    this.emitter.emit(EVENT_NAME, event);
  }
}
