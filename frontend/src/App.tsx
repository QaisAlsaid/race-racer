import { Routes, Route } from "react-router-dom";
import "./css/App.css";
import GuessCard from "./components/GuessCard.jsx";
import Navbar from "./components/Navbar.jsx";
import Home from "./pages/Home.js";
import Lobby from "./pages/Lobby.jsx";
import Loading from "./components/Loading.jsx";
import { GameProvider } from "./context/GameContext.js";
import { useEffect, useState } from "react";
import {
  connect,
  SocketConnectionState,
  subscribeState,
} from "./services/WS.js";
import ConnectionHandler from "./pages/ConnectionHandler.js";
import { Constants } from "./Constants.js";
import Game from "./pages/Game.js";
import Standings from "./pages/Standings.js";
import FourOFour from "./pages/404.js"

function App() {
  const [connState, setConnState] = useState(SocketConnectionState.UNKNOWN);

  function connectWS() {
    connect(Constants.WS_URL);
  }

  useEffect(() => {
    const unsubscribe = subscribeState({ callback: setConnState, name: "app" });
    connectWS();
    return unsubscribe;
  }, []);

  return (
    <GameProvider>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/connection-handler" element={<ConnectionHandler />} />
          <Route path="/game" element={<Game />} />
          <Route path="standings" element={<Standings />} />
          <Route path="*" element={<FourOFour/>} />
        </Routes>
      </main>
    </GameProvider>
  );
}

export default App;
