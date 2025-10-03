import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  connect,
  getLastSocketConnectionState,
  SocketConnectionState,
  subscribeState,
} from "../services/WS.js";
import { Constants } from "../Constants.js";
import { useGameContext, type GameContext } from "../context/GameContext.js";

function ConnectionHandler() {
  const { invalidate } = useGameContext() as GameContext

  const navigate = useNavigate();

  const [socketState, setSocketState] = useState(
    getLastSocketConnectionState()
  );

  useEffect(() => {
    function onSocketStateChange(s: SocketConnectionState) {
      switch (s) {
        case SocketConnectionState.CONNECTED: {
          invalidate(true);
          navigate("/");
          break;
        }
        case SocketConnectionState.CLOSED: {
          invalidate(true);
          setSocketState(SocketConnectionState.CLOSED);
          break;
        }
        case SocketConnectionState.CONNECTING: {
          invalidate(true);
          setSocketState(SocketConnectionState.CONNECTING);
          break;
        }
        case SocketConnectionState.ERROR: {
          invalidate(true);
          setSocketState(SocketConnectionState.ERROR);
          break;
        }
      }
    }
    onSocketStateChange(getLastSocketConnectionState())
    const stateSubscription = subscribeState({
      callback: onSocketStateChange,
      name: "disconnect",
    });
    return stateSubscription;
  }, [navigate]);

    function onReconnect() {
      connect(Constants.WS_URL);
    }

    return (
      <div className="connection-handler">
        {socketState !== SocketConnectionState.CONNECTING && <div className="reconnect">
          {socketState === SocketConnectionState.ERROR && (
            <p>Error occurred in websocket connection</p>
          )}
          <button onClick={onReconnect}>Reconnect</button>
        </div>}
        {socketState === SocketConnectionState.CONNECTING && <p className="loading">Loading...</p>}
    </div>
    )
}

export default ConnectionHandler;
