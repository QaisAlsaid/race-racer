import { BaseEvent, BaseResponsePayload, ConnectionResponsePayload, EventType } from "./Schema.js";
import { getWS, send,  } from "./WS.js";

let heartbeatInterval: any = null;
let lastTick = Date.now()


export function startHeartbeat(payload: ConnectionResponsePayload) {
  const HBMS = payload.heartbeat_interval * 1000;
  const HBTOMS = payload.heartbeat_timeout * 1000;
  if (heartbeatInterval) return;

  lastTick = Date.now()

  heartbeatInterval = setInterval(() => {
    console.log("sending heartbeat interval:", HBMS)
    send(new BaseEvent(EventType.HEART_BEAT, new BaseResponsePayload()))

    //if (Date.now() - lastTick > HBTOMS) {
    //  console.warn("heartbeat timeout: connection seems dead")
    //  getWS()?.close();
    //  stopHeartbeat();
    //}
  }, HBMS);
  console.log("started heartbeat");
}

export function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
    console.log("stopped heartbeat")
  }
}