import { useState, useEffect } from "react";
import "../css/Home.css";
import { useGameContext, type GameContext } from "../context/GameContext.js";
import {
  connect,
  getLastSocketConnectionState,
  send,
  SocketConnectionState,
  subscribe,
  subscribeState,
} from "../services/WS.js";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  BaseEvent,
  ErrorPayload_,
  EventType,
  Party,
  PartyCreationPayload,
  PartyEnteredPayload,
  PartyIdentificationPayload,
  PartyPayload,
  PartyRegisterPayload,
  Player,
} from "../services/Schema.js";
import { Constants } from "../Constants.js";

function Home() {
  const navigate = useNavigate();
  //const [checkIfInStateArray, addToTheStateArray, removeFromTheStateArray] = useGameContext()

  const { setParty, setSettings } = useGameContext() as GameContext;
  const [name, setName] = useState("");
  const [lobby, setLobby] = useState("");
  const [loading, setLoading] = useState(false);
  const [canShow, setCanShow] = useState(false);

  const [searchParams] = useSearchParams();
  const searchLobbyId = searchParams.get("party_id");
  const searchName = searchParams.get("name");

  useEffect(() => {
    if (searchLobbyId != null) {
      setLobby(searchLobbyId);
    }
    if (searchName != null) {
      setName(searchName);
    }
  }, [searchParams]);

  useEffect(() => {
    connect(Constants.WS_URL);
    const unsubscribe = subscribe({
      callback: (event: BaseEvent) => {
        if (event.event == EventType.PARTY_CREATED) {
          let payload = event.data as PartyEnteredPayload;
          console.log("created party: ", payload.party_id);
          console.log("party info:", payload);
          const party = new Party(
            payload.party_id,
            payload.host,
            payload.players,
            payload.last_winners
          );
          setParty(party);
          setSettings(payload.settings);
          navigate("lobby?is_new_game=true");
          //navigate(`/lobby?party_id=${payload.party_id}`)
        } else if (event.event == EventType.PARTY_JOINED) {
          let payload = event.data as PartyEnteredPayload;
          console.log("joined party: ", payload.party_id);
          console.log("party info:", payload);
          const party = new Party(
            payload.party_id,
            payload.host,
            payload.players,
            payload.last_winners
          );
          setParty(party);
          setSettings(payload.settings);
          navigate("/lobby?is_new_game=true");
          //navigate(`/lobby?party_id=${payload.party_id}`)
        } else if (event.event == EventType.ERROR) {
          let payload = event.data as ErrorPayload_;
          console.error("server error: ", payload.code, ": ", payload.message);
          alert("server error: " + payload.code + ": " + payload.message);
          setLoading(false);
        }
      },
      name: "home",
    });

    function onSocketStateChange(state: SocketConnectionState) {
      if (state !== SocketConnectionState.CONNECTED) {
        navigate("/connection-handler");
      } else {
        setCanShow(true);
      }
    }

    onSocketStateChange(getLastSocketConnectionState());
    const unsubscribeState = subscribeState({
      callback: onSocketStateChange,
      name: "home",
    });

    function cleanUp() {
      unsubscribe();
      unsubscribeState();
    }

    return cleanUp;
  }, [navigate]);

  function handleSubmit(e: any) {
    e.preventDefault();
  }

  function onCreateLobby() {
    if (checkStrAgainstEmptiness(name)) {
      setLoading(true);
      send(
        new BaseEvent(
          EventType.CREATE_PARTY,
          new PartyCreationPayload({ player_name: name })
        )
      );
    } else {
      alert("User name can't be empty");
    }
  }

  function checkStrAgainstEmptiness(str: string) {
    if (str.length === 0) return false;
    while(str.startsWith(' ')) {
      str = str.substring(1);
    }
    if (str.length === 0) return false;
    return true;
  }

  function onJoinLobby() {
    if (!checkStrAgainstEmptiness(name)) {
      alert("User name can't be empty");
    } else if (!checkStrAgainstEmptiness(lobby)) {
      alert("Lobby code can't be empty");
    } else {
      send(
        new BaseEvent(
          EventType.JOIN_PARTY,
          new PartyRegisterPayload({ player_name: name, party_id: lobby })
        )
      );
    }
  }

  if (loading) {
    return <p>Waiting for server...</p>;
  }

  return canShow && (
    <div className="home">
      <h2 className="header">Race Racer</h2>
      <form onSubmit={handleSubmit} className="name-form">
        <input
          type="text"
          placeholder="What's your name?"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="name-input"
        ></input>
      </form>
      <form onSubmit={handleSubmit} className="join-lobby-form">
        <input
          type="text"
          placeholder="Lobby code (leave blank when creating new lobby)"
          value={lobby}
          onChange={(e) => setLobby(e.target.value)}
          className="lobby-input"
        ></input>
      </form>
      <div className="buttons">
        <button className="create-lobby-button" onClick={onCreateLobby}>
          Create new lobby
        </button>
        <button className="join-lobby-button" onClick={onJoinLobby}>
          Join existing lobby
        </button>
      </div>
    </div>
  );
}

export default Home;
