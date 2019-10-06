import { ClientRequest } from 'http';
import { SocketDetector } from './socket-detector';
import { ResponseDetector } from './response-detector';
import { RequestDetector } from './request-detector';
import { RequestObserver } from './request-observer';
import { Detector } from './detector';

export type RequestTimerErrorObject = {
  message: string;
  error?: Error;
};

export class RequestTimerError extends Error {
  constructor(message: string, error?: Error) {
    super(message);

    this.name = 'RequestTimerError';
    this.error = error;
  }

  private readonly error?: Error;

  toJSON(): RequestTimerErrorObject {
    return {
      message: this.message,
      error: this.error
    };
  }
}

export type SourceTimings = {
  request?: number;
  socket?: number;
  finish?: number;
  lookup?: number;
  connect?: number;
  upload?: number;
  response?: number;
  end?: number;
  error?: number;
};

type PhaseValue = number | null;

export type Timings = {
  wait: PhaseValue;
  dns: PhaseValue;
  tcp: PhaseValue;
  request: PhaseValue;
  firstByte: PhaseValue;
  download: PhaseValue;
  total: PhaseValue;
};

const lastEvents: (keyof SourceTimings)[] = ['error', 'end'];

export default class RequestTimer {
  constructor() {
    this.requestObserver = new RequestObserver();

    const socketDetector = new SocketDetector({ requestObserver: this.requestObserver });
    const responseDetector = new ResponseDetector({ requestObserver: this.requestObserver });
    this.requestDetector = new RequestDetector({
      requestObserver: this.requestObserver,
      socketDetector: socketDetector,
      responseDetector: responseDetector
    });

    this.detectors = [socketDetector, responseDetector, this.requestDetector];
  }

  private readonly requestDetector: RequestDetector;
  private readonly requestObserver: RequestObserver;
  private timings: SourceTimings = {};
  private detectors: Detector[];
  private isRequestInited: boolean = false;

  public subscribe(request: ClientRequest): void {
    if (!this.isRequestInited) {
      this.isRequestInited = true;
      this.requestObserver.onDetectedEvent(this.eventHandler);
    } else {
      throw new RequestTimerError('Attempted to subscribe to request more than once');
    }

    this.requestDetector.subscribe(request);
  }

  public calcTimings(): Timings {
    return {
      wait: this.calculatePhase(this.timings.request, this.timings.socket),
      dns: this.calculatePhase(this.timings.socket, this.timings.lookup),
      tcp: this.calculatePhase(this.timings.lookup, this.timings.connect),
      request: this.calculatePhase(this.timings.connect, this.timings.upload),
      firstByte: this.calculatePhase(this.timings.upload, this.timings.response),
      download: this.calculatePhase(this.timings.response, this.timings.end),
      total:
        this.calculatePhase(this.timings.request, this.timings.end) ||
        this.calculatePhase(this.timings.request, this.timings.error)
    };
  }

  private unSubscribe(): void {
    this.detectors.forEach((detector: Detector) => {
      detector.unSubscribe();
    });
  }

  private checkRequestUploaded(event: keyof SourceTimings): boolean {
    return Boolean((this.timings.finish && event === 'connect') || (this.timings.connect && event === 'finish'));
  }

  private eventHandler = (event: keyof SourceTimings): void => {
    this.setEventTime(event);

    if (this.checkRequestUploaded(event)) {
      this.setEventTime('upload');
    }

    if (lastEvents.includes(event)) {
      this.unSubscribe();
    }
  }

  private setEventTime(event: keyof SourceTimings): void {
    if (!this.timings[event]) {
      this.timings[event] = Date.now();
    }
  }

  private calculatePhase(start?: number, end?: number): PhaseValue {
    if (typeof start === 'number' && typeof end === 'number') {
      return end - start;
    }

    return null;
  }
}
