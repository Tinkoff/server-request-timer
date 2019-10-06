import RequestTimer, { RequestTimerError } from "../request-timer";

const requestOnce = jest.fn();
const socketOnce = jest.fn();
const responseOnce = jest.fn();
const requestRemoveListener = jest.fn();
const socketRemoveListener = jest.fn();
const responseListener = jest.fn();
const dateNowMock = jest.spyOn(Date, "now");
const request: any = { once: requestOnce, removeListener: requestRemoveListener };
const socket: any = { once: socketOnce, removeListener: socketRemoveListener };
const response: any = { once: responseOnce, removeListener: responseListener };
const defaultDateValue = 0;
const socketCallTime = 1;
const lookupCallTime = 2;
const connectCallTime = 3;
const finishCallTime = 3;
const uploadCallTime = 5;
const responseCallTime = 6;
const endCallTime = 7;
const errorCallTime = 100;
const anotherErrorCallTime = 120;

let requestTimer: RequestTimer;

const successRequest = () => {
  dateNowMock
    .mockReturnValueOnce(socketCallTime)
    .mockReturnValueOnce(lookupCallTime)
    .mockReturnValueOnce(connectCallTime)
    .mockReturnValueOnce(finishCallTime)
    .mockReturnValueOnce(uploadCallTime)
    .mockReturnValueOnce(responseCallTime)
    .mockReturnValueOnce(endCallTime);

  getFirstCallbackByEvent(requestOnce, "socket")(socket);
  getFirstCallbackByEvent(socketOnce, "lookup")();
  getFirstCallbackByEvent(socketOnce, "connect")();
  getFirstCallbackByEvent(requestOnce, "finish")();
  getFirstCallbackByEvent(requestOnce, "response")(response);
  getFirstCallbackByEvent(responseOnce, "end")();
};

const getFirstCallbackByEvent = (mockFn: jest.Mock, event: string): ((arg?: any) => void) => {
  const calls = mockFn.mock.calls;

  const [callback] = calls.filter((args: any) => args[0] === event).map((args: any) => args[1]);

  return callback.bind(requestTimer);
};

describe("RequestTimer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    dateNowMock.mockReturnValue(defaultDateValue);

    requestTimer = new RequestTimer();
    requestTimer.subscribe(request);
  });

  afterAll(() => {
    dateNowMock.mockRestore();
  });

  it("request timer error serializes to object with message, error", () => {
    const underlyingError = new Error("Some low level error");
    const error = new RequestTimerError("Attempted to subscribe to request more than once", underlyingError);

    expect(error.toJSON()).toMatchInlineSnapshot(`
      Object {
        "error": [Error: Some low level error],
        "message": "Attempted to subscribe to request more than once",
      }
    `);
  });

  it("wait correctly calculated", () => {
    dateNowMock.mockReturnValueOnce(socketCallTime);
    getFirstCallbackByEvent(requestOnce, "socket")(socket);

    expect(requestTimer.calcTimings()).toMatchObject({
      wait: socketCallTime - defaultDateValue
    });
  });

  it("dns correctly calculated", () => {
    successRequest();

    expect(requestTimer.calcTimings()).toMatchObject({
      dns: lookupCallTime - socketCallTime
    });
  });

  it("tcp correctly calculated", () => {
    successRequest();

    expect(requestTimer.calcTimings()).toMatchObject({
      tcp: connectCallTime - lookupCallTime
    });
  });

  it("tcp correctly calculated (writable socket)", () => {
    const writableSocket = { ...socket, writable: true };
    dateNowMock
      .mockReturnValueOnce(socketCallTime)
      .mockReturnValueOnce(connectCallTime)
      .mockReturnValueOnce(lookupCallTime);

    getFirstCallbackByEvent(requestOnce, "socket")(writableSocket);
    getFirstCallbackByEvent(socketOnce, "lookup")();

    expect(requestTimer.calcTimings()).toMatchObject({
      tcp: connectCallTime - lookupCallTime
    });
  });

  it("request correctly calculated", () => {
    successRequest();

    expect(requestTimer.calcTimings()).toMatchObject({
      request: uploadCallTime - connectCallTime
    });
  });

  it("request calculated without socket connection", () => {
    successRequest();

    expect(requestTimer.calcTimings()).toMatchObject({
      request: uploadCallTime - connectCallTime
    });
  });

  it("firstBytes calculated", () => {
    successRequest();

    expect(requestTimer.calcTimings()).toMatchObject({
      firstByte: responseCallTime - uploadCallTime
    });
  });

  it("download calculated", () => {
    dateNowMock.mockReturnValueOnce(responseCallTime).mockReturnValueOnce(endCallTime);

    getFirstCallbackByEvent(requestOnce, "response")(response);
    getFirstCallbackByEvent(responseOnce, "end")();

    expect(requestTimer.calcTimings()).toMatchObject({
      download: endCallTime - responseCallTime
    });
  });

  it("total calculated (start - end)", () => {
    dateNowMock.mockReturnValueOnce(responseCallTime).mockReturnValueOnce(endCallTime);

    getFirstCallbackByEvent(requestOnce, "response")(response);
    getFirstCallbackByEvent(responseOnce, "end")();

    expect(requestTimer.calcTimings()).toMatchObject({
      total: endCallTime - defaultDateValue
    });
  });

  it("total calculated (request error)", () => {
    dateNowMock.mockReturnValueOnce(errorCallTime);

    getFirstCallbackByEvent(requestOnce, "error")();

    expect(requestTimer.calcTimings()).toMatchObject({
      total: errorCallTime - defaultDateValue
    });
  });

  it("total calculated (response error)", () => {
    dateNowMock.mockReturnValueOnce(responseCallTime).mockReturnValueOnce(errorCallTime);

    getFirstCallbackByEvent(requestOnce, "response")(response);
    getFirstCallbackByEvent(responseOnce, "error")();

    expect(requestTimer.calcTimings()).toMatchObject({
      total: errorCallTime - defaultDateValue
    });
  });

  it("total calculated (socket error)", () => {
    dateNowMock.mockReturnValueOnce(socketCallTime).mockReturnValueOnce(errorCallTime);

    getFirstCallbackByEvent(requestOnce, "socket")(socket);
    getFirstCallbackByEvent(socketOnce, "error")();

    expect(requestTimer.calcTimings()).toMatchObject({
      total: errorCallTime - defaultDateValue
    });
  });

  it("twice trigger", () => {
    dateNowMock
      .mockReturnValueOnce(responseCallTime)
      .mockReturnValueOnce(errorCallTime)
      .mockReturnValueOnce(anotherErrorCallTime);

    getFirstCallbackByEvent(requestOnce, "response")(response);
    getFirstCallbackByEvent(requestOnce, "error")();
    getFirstCallbackByEvent(responseOnce, "error")();

    expect(requestTimer.calcTimings()).toMatchObject({
      total: errorCallTime - defaultDateValue
    });
  });

  it("one subscribe on class", () => {
    expect(() => requestTimer.subscribe(request)).toThrowErrorMatchingInlineSnapshot(`"Attempted to subscribe to request more than once"`);
  });

  it("remove all listeners from request", () => {
    successRequest();

    expect(request.removeListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(request.removeListener).toHaveBeenCalledWith("socket", expect.any(Function));
    expect(request.removeListener).toHaveBeenCalledWith("finish", expect.any(Function));
    expect(request.removeListener).toHaveBeenCalledWith("response", expect.any(Function));
  });

  it("remove all listeners from request", () => {
    successRequest();

    expect(socket.removeListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(socket.removeListener).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(socket.removeListener).toHaveBeenCalledWith("lookup", expect.any(Function));
  });

  it("remove all listeners from socket", () => {
    successRequest();

    expect(socket.removeListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(socket.removeListener).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(socket.removeListener).toHaveBeenCalledWith("lookup", expect.any(Function));
  });

  it("remove all listeners from response", () => {
    successRequest();

    expect(response.removeListener).toHaveBeenCalledWith("error", expect.any(Function));
    expect(response.removeListener).toHaveBeenCalledWith("end", expect.any(Function));
  });
});
