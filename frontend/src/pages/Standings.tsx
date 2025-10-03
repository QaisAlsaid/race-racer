import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGameContext, type GameContext } from "../context/GameContext.js";
import { preloadImages } from "../services/Preload.js";
import "../css/Standings.css"
import { BaseEvent, EventType, GameStatePayload, StatsPayload, Party, GuessesPayload, PartyPayload, PlayerGuess, Guess, GameType } from "../services/Schema.js";
import { SocketConnectionState, getClientId, getLastSocketConnectionState, subscribe, subscribeState } from "../services/WS.js";

function Standings() {
  const navigate = useNavigate();
  const { party, scores, settings, setParty, setSettings, allPlayersGuesses, allGuesses } = useGameContext() as GameContext;
  
  const [isGameEnd, setIsGameEnd] = useState(false);
  const [gotoLobby, setGotoLobby] = useState(false);

  const [searchParams] = useSearchParams();
  const searchIsGameEnd = searchParams.get("is_game_end");

  useEffect(() => {
    if (searchIsGameEnd != null) {
      setIsGameEnd(searchIsGameEnd.toLowerCase() === "true");
    }
  }, [searchParams]);

  useEffect(()=> {

    function onMessage(event: BaseEvent) {
      switch (event.event) {
        case EventType.ERROR: {
          break;
        }
        case EventType.PARTY_STATE_UPDATE: {
          let payload = event.data as PartyPayload;
          setParty(payload);
        }
      }
    }

    function onConnectionStateChange(state: SocketConnectionState) {
      if (state !== SocketConnectionState.CONNECTED) {
        navigate("/connection-handler");
      }
    }

    onConnectionStateChange(getLastSocketConnectionState());

    const unsubscribe = subscribe({ callback: onMessage, name: "standings" });
    const unsubscribeState = subscribeState({
      callback: onConnectionStateChange,
      name: "standings",
    });

    function cleanUp() {
      unsubscribe();
      unsubscribeState();
    }

    return cleanUp;
  }, [navigate])

  useEffect(() => {
    if (gotoLobby) {
      if (!isGameEnd) {
        navigate("/lobby?is_new_game=false")
      } else {
        let name = ""
        party.players.forEach((p)=>{
          if (p.player_id===getClientId()) {
            name=p.name;
          }
        })
        if (name.length !== 0) {
          navigate(`/?name=${name}`)
        } else {
          navigate("/")
        }
      }
    }
  }, [gotoLobby]);

  function getMostGuesses() {
    let largest: Array<PlayerGuess> = [];
    allPlayersGuesses.forEach((entry) => {
      if (entry.length > largest.length)
        largest = entry;
    });
    return largest;
  }

  function wasGuessCorrect(guess: PlayerGuess, index: number) {
    const correctGuess = allGuesses[index]!;
      switch(settings.game_type!) {
        case GameType.RACE: {
          return correctGuess.race === guess.race;
        }
        case GameType.AGE: {
          return correctGuess.age_range === guess.age_range;
        }
        case GameType.GENDER: {
          return correctGuess.gender === guess.gender;
        }
      }
  }

  function guessValue(guess: PlayerGuess) {
    switch(settings.game_type!) {
        case GameType.RACE: {
          return guess.race;
        }
        case GameType.AGE: {
          return guess.age_range;
        }
        case GameType.GENDER: {
          return guess.gender;
        }
      }
  }

  return (
    <div className="standings">
      <h2 className="standings-header">{isGameEnd ? "Game Over!" : "Round Ended"}</h2>
      <div className="standings-table-container">
        <table className="standings-table">
          <thead>
            <tr>
              <th>Round</th>
              {party.players.map((p) => (
                <th key={p.player_id}>{p.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {getMostGuesses().map((guess, index) => (
              <tr key={index}>
                <td className="guess-image-cell"><img className="guess-image" src={allGuesses[index]?.url} alt={`Guess: ${index+1}`} ></img></td>
                {
                  <td className={wasGuessCorrect(guess, index) ? "correct-guess" : "wrong-guess"} key={index}>{guessValue(guess)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button className="back-button" onClick={()=>{
        setGotoLobby(true);
      }}>{isGameEnd ? "Back to Home" : "Back to Lobby"}</button>
    </div>
  )
}

export default Standings