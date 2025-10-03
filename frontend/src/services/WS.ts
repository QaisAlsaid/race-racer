import { startHeartbeat, stopHeartbeat } from "./Heartbeat.js";
import { BaseEvent, ConnectionResponsePayload, EventType, parseEvent } from "./Schema.js";

export interface Subscriber {
  callback: Function;
  name: string;
}

export enum SocketConnectionState {
  ERROR,
  CONNECTED,
  CONNECTING,
  CLOSED,
  UNKNOWN,
}

let socket: WebSocket | null;
let client_id: string;
let listeners: Array<Subscriber> = [];
let stateListeners: Array<Subscriber> = [];
let cachedSocketState: SocketConnectionState = SocketConnectionState.UNKNOWN;

function notifyState(state: SocketConnectionState) {
  stateListeners.forEach((cb) => cb.callback(state));
}

export function getWS() {
  return socket;
}

export function connect(url: string) {
  if (socket) return socket;
  socket = new WebSocket(url);

  socket.onerror = () => {
    console.error("websocket error");
    notifyState(SocketConnectionState.ERROR);
    socket = null;
    cachedSocketState = SocketConnectionState.ERROR;
  };

  socket.onopen = () => {
    console.log("websocket connected: ", url);
    notifyState(SocketConnectionState.CONNECTED);
    cachedSocketState = SocketConnectionState.CONNECTED;
  };

  socket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    console.log("raw json received: ", data);

    let event = parseEvent(data);

    console.log("converted event: ", event);

    if (event.event === EventType.CONNECTION_RESPONSE) {
      client_id = event.data.client_id;
      console.log("client_id: ", client_id);
      startHeartbeat(event.data as ConnectionResponsePayload);
      return;
    }
    if (event.event === EventType.ERROR) {
    }
    if (event.event === EventType.CLOSING) {
      stopHeartbeat();
    }

    listeners.forEach((cb) => cb.callback(event));
  };

  socket.onclose = () => {
    console.log("websocket disconnected");
    notifyState(SocketConnectionState.CLOSED);
    stopHeartbeat();
    socket = null;
    cachedSocketState = SocketConnectionState.CLOSED;
  };

  return socket;
}

export function getClientId() {
  return client_id;
}

export function getLastSocketConnectionState() {
  return cachedSocketState;
}

export function send(event: BaseEvent) {
  event.data.client_id = client_id;
  console.log("sent event: ", event);
  if (socket && socket.readyState === WebSocket.OPEN) {
    let json = JSON.stringify(event);
    console.log("json sent event: ", json);
    socket.send(json);
  } else {
    console.warn("websocket not connected");
  }
}

export function subscribe(subscriber: Subscriber) {
  console.log("[messages] new subscriber: ", subscriber.name);
  listeners.push(subscriber);
  return () => {
    console.log("[messages] subscriber unsubscribed: ", subscriber.name);
    listeners = listeners.filter((cb) => cb !== subscriber);
  };
}

export function subscribeState(subscriber: Subscriber) {
  console.log("[state] new subscriber: ", subscriber.name);
  stateListeners.push(subscriber);
  return () => {
    console.log("[state] subscriber unsubscribed: ", subscriber.name);
    stateListeners = stateListeners.filter((cb) => cb !== subscriber);
  };
}
