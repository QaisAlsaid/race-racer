import { useNavigate, useSearchParams } from "react-router-dom";
import { useGameContext, type GameContext } from "../context/GameContext.js";
import { useEffect, useState } from "react";
import "../css/Lobby.css"
import {
  getClientId,
  getLastSocketConnectionState,
  send,
  SocketConnectionState,
  subscribe,
  subscribeState,
} from "../services/WS.js";
import {
  BaseEvent,
  EventType,
  GameStartedPayload,
  GuessesPayload,
  PartyIdentificationPayload,
  PartyPayload,
  PartySettings,
  PartySettingsPayload,
  PartySettingsUpdatePayload,
  Player,
} from "../services/Schema.js";
import { preloadImages } from "../services/Preload.js";

function Lobby() {
  const navigate = useNavigate();
  const {
    party,
    settings,
    winners,
    setParty,
    setSettings,
    setBatchCount,
    setCurrentGuess,
    setCurrentBatch,
  } = useGameContext() as GameContext;
  const [canShow, setCanShow] = useState(party.party_id !== '');
  const [isNewGame, setIsNewGame] = useState(false);
  const [createdPartySettings , setCreatedPartySettings] = useState(new PartySettings())
  const [isCopied, setIsCopied] = useState(false);
  const [searchParams] = useSearchParams();
  const searchIsNewGame = searchParams.get("is_new_game");

  useEffect(() => {
    if (searchIsNewGame != null) {
      setIsNewGame(searchIsNewGame.toLowerCase() === "true");
    }
  }, [searchParams]);

  useEffect(() => {
    function onMessage(event: BaseEvent) {
      if (event.event == EventType.PARTY_STATE_UPDATE) {
        let payload = event.data as PartyPayload;
        setParty(payload);
      } else if (event.event == EventType.PARTY_SETTINGS_UPDATE) {
        let payload = event.data as PartySettingsUpdatePayload;
        setSettings(payload.settings);
      } else if (event.event == EventType.GAME_STARTED) {
        let payload = event.data as GameStartedPayload;
        setBatchCount(0);
        setCurrentBatch(payload.initial_batch);
        preloadImages(payload.initial_batch.map((g) => g.url));
        setCurrentGuess(0);
        navigate("/game");
      } else if (event.event == EventType.ROUND_START) {
        let payload = event.data as GuessesPayload;
        setBatchCount(0);
        setCurrentGuess(0);
        setCurrentBatch(payload.batch);
        preloadImages(payload.batch.map((g) => g.url));
        navigate("/game");
      }
    }

    function onConnectionStateChange(state: SocketConnectionState) {
      if (state !== SocketConnectionState.CONNECTED) {
        navigate("/connection-handler");
      } else {
        setCanShow(party.party_id !== '');
      }
    }

    onConnectionStateChange(getLastSocketConnectionState());

    const unsubscribe = subscribe({ callback: onMessage, name: "lobby" });
    const unsubscribeState = subscribeState({
      callback: onConnectionStateChange,
      name: "lobby",
    });

    function cleanUp() {
      unsubscribe();
      unsubscribeState();
    }

    return cleanUp;
  }, [navigate]);

  useEffect(() => {
    if (!canShow) {
      navigate("/");
    }
  }, [canShow, navigate]);

    function getState(player: string) {
      let thisPlayersScore = 0;
      let highest = 0;
      party.players.forEach((p) => {
        if (p.score > highest)
          highest = p.score;
        if (p.player_id === player)
          thisPlayersScore = p.score;
      })
      if (highest !== 0 && thisPlayersScore === highest) return "winner"
      return "player";
    }

    return canShow && (
      <div className="lobby">
        <h2 className="lobby-title">Lobby</h2>
        <p className="party-id">
          <span className="party-id-label">Party ID: </span>
          <span className="party-id-value">{party.party_id}</span>
          <button className={`copy-id-button ${isCopied?"copied":""}`} onClick={() => {
            navigator.clipboard.writeText(party.party_id);
            setIsCopied(true)
            const interval = setInterval(() => {
              setIsCopied(false)
              clearInterval(interval);
            }, 2000);
          }}>{ isCopied ? "Copied" : "Copy"}</button>
        </p>
        <div className="players">
          <h3>Players</h3>
          <div className="players-grid">
            {party.players.map((p: Player) => (
              <div className={getState(p.player_id)} key={p.player_id}>
                <span className="player-name" >{p.name}</span>
                <span className="player-score">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="settings">
          <h3>Game Settings</h3>
          { party.host ===  getClientId() && isNewGame && (
            <div className="settings-form">
              <label>Time:
                <input type="number" onChange={(e) => {
                  const newPartySettings = new PartySettings(
                    createdPartySettings.game_type, createdPartySettings.max_guesses,
                     createdPartySettings.max_score, Number(e.target.value)
                  )
                  setCreatedPartySettings(newPartySettings)
                }}></input>
              </label>
              <label>Max guesses:
                <input type="number" onChange={(e) => {
                  const newPartySettings = new PartySettings(
                    createdPartySettings.game_type, Number(e.target.value),
                     createdPartySettings.max_score, createdPartySettings.time
                  )
                  setCreatedPartySettings(newPartySettings)
                }}></input>
              </label>
                <label>Max score:
                <input type="number" onChange={(e) => {
                  const newPartySettings = new PartySettings(
                    createdPartySettings.game_type, createdPartySettings.max_guesses,
                     Number(e.target.value), createdPartySettings.time
                  )
                  setCreatedPartySettings(newPartySettings)
                }}></input>
              </label>
            <button
            onClick={() => {
              let pl = new PartySettingsPayload({
                party_id: party.party_id,
                settings: createdPartySettings,
              });
              let be = new BaseEvent(EventType.SET_PARTY_SETTINGS, pl);
              send(be);
            }}
          >Update Settings</button>
        </div> 
          )} 
          <div className="setting-readonly">
            <p>Game type: {settings.game_type}</p>
            <p>Max guesses: { settings.max_guesses === undefined ? "Unlimited" : settings.max_guesses }</p>
            <p>Max score: { settings.max_score === undefined ? "Unlimited" : settings.max_score }</p>
            <p>Time: {settings.time}</p>
          </div>
        </div>
        {party.host === getClientId() && (
          <button className="start-button"
            onClick={() => {
              let pi = new PartyIdentificationPayload({
                party_id: party.party_id,
              });
              let be = new BaseEvent(isNewGame ? EventType.GAME_START : EventType.ROUND_START, pi);
              send(be);
            }}
          >Start { isNewGame ? "Game" : "Round" }</button>
        )}
      </div>
    );
}

export default Lobby;
