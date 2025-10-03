import { useEffect, useState } from "react";
import { useGameContext, type GameContext } from "../context/GameContext.js";
import "../css/Game.css"
import {
  AgeRanges,
  BaseEvent,
  EventType,
  GameStatePayload,
  Gender,
  Guess,
  GuessesPayload,
  isAgeRange,
  isGender,
  isRace,
  Party,
  PartyPayload,
  PartySettingsUpdatePayload,
  PlayerGuess,
  PlayerGuessPayload,
  Race,
  RequestGuessesPayload,
  StatsPayload,
} from "../services/Schema.js";
import {
  getLastSocketConnectionState,
  send,
  SocketConnectionState,
  subscribe,
  subscribeState,
} from "../services/WS.js";
import { useNavigate } from "react-router-dom";
import GuessCard from "../components/GuessCard.js";
import { preloadImages } from "../services/Preload.js";
import GameHeader from "../components/GameHeader.js";

function Game() {
  const navigate = useNavigate();
  const {
    party,
    settings,
    setParty,
    setSettings,
    setScores,
    currentBatch,
    currentGuess,
    nextBatch,
    setCurrentBatch,
    setNextBatch,
    setCurrentGuess,
    batchCount,
    setBatchCount,
    setAllGuesses,
    setAllPlayersGuesses,
    setWinners,
  } = useGameContext() as GameContext;

  const [waitingForNextBatch, setWaitingForNextBatch] = useState(false);
  const [canPlay, setCanPlay] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | undefined>(undefined);

  useEffect(() => {
    setTimeLeft(settings.time);
    function onMessage(event: BaseEvent) {
      switch (event.event) {
        case EventType.GAME_STATE_UPDATE: {
          let payload = event.data as GameStatePayload;
          setScores(payload.scores);
          setTimeLeft((prev) => {
          if (prev === undefined) return undefined;
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
          break;
        }
        case EventType.GAME_END: {
          let payload = event.data as StatsPayload;
          setAllGuesses(payload.guesses);
          let newParty = new Party(
            payload.party_id,
            party.host,
            payload.players,
            party.last_winners
          );
          setParty(newParty);
          setWinners(payload.winners);
          setAllGuesses(payload.guesses);
          setAllPlayersGuesses(payload.players_guesses);
          navigate("/standings?is_game_end=true");
          break;
        }
        case EventType.ERROR: {
          break;
        }
        case EventType.REQUEST_GUESSES_RESPONSE: {
          let payload = event.data as GuessesPayload;
          setNextBatch(payload.batch);
          setWaitingForNextBatch(false);
          setCanPlay(true);
          preloadImages(payload.batch.map((g) => g.url));
          break;
        }
        case EventType.ROUND_END: {
          let payload = event.data as StatsPayload;
          setAllGuesses(payload.guesses);
          let newParty = new Party(
            payload.party_id,
            party.host,
            payload.players,
            party.last_winners
          );
          setParty(newParty);
          setWinners(payload.winners);
          setAllGuesses(payload.guesses);
          setAllPlayersGuesses(payload.players_guesses);
          navigate("/standings?is_game_end=false");
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
      } else {
        setCanPlay(currentBatch.length != 0);
      }
    }

    onConnectionStateChange(getLastSocketConnectionState());

    const unsubscribe = subscribe({ callback: onMessage, name: "game" });
    const unsubscribeState = subscribeState({
      callback: onConnectionStateChange,
      name: "game",
    });

    function cleanUp() {
      unsubscribe();
      unsubscribeState();
    }

    return cleanUp;
  }, [navigate]);

  // useEffect(() => {
  //   let interval: any;

  //   if (settings.time) {
  //     setTimeLeft(settings.time);

  //     interval = setInterval(() => {
  //       setTimeLeft((prev) => {
  //         if (prev === undefined) return undefined;
  //         if (prev <= 1) {
  //           clearInterval(interval);
  //           return 0;
  //         }
  //         return prev - 1;
  //       });
  //     }, 1000);
  //   }
  //   return () => clearInterval(interval);
  // }, [settings.time, batchCount]);

  function requestNewBatch() {
    setWaitingForNextBatch(true);
    const index = batchCount! + 1;
    let payload = new RequestGuessesPayload({
      party_id: party.party_id,
      new_batch_index: index,
    });
    let event = new BaseEvent(EventType.REQUEST_GUESSES, payload);
    send(event);
  }

  function incrementGuess() {
    if (currentGuess === undefined) return;
    if (settings.max_guesses !== undefined && settings.max_guesses <= currentGuess) {
      setCanPlay(false);
      return;
    }
    if (currentGuess % 10 == 5) {
      requestNewBatch();
    }
    setCurrentGuess((prev) => {
      const newVal = prev! + 1;
      if (waitingForNextBatch && newVal % 10 == 0) {
        setCanPlay(false);
      } else if (newVal % 10 == 0 && canPlay) {
        setCurrentBatch(nextBatch);
        setBatchCount((prev) => prev! + 1);
        setNextBatch([]);
      }
      return newVal;
    });
  }

  function submitGuess(guess: AgeRanges | Race | Gender) {
    let player_guess = new PlayerGuess(
      currentGuess,
      isAgeRange(guess) ? guess : undefined,
      isGender(guess) ? guess : undefined,
      isRace(guess) ? guess : undefined
    );
    let payload = new PlayerGuessPayload({
      party_id: party.party_id,
      guess: player_guess,
    });
    let event = new BaseEvent(EventType.GUESS_MADE, payload);
    send(event);
  }

  //function onSubmit(guess: AgeRanges | Race | Gender) {
  //  submitGuess(guess);
  //  incrementGuess();
  //}

  return (
    <div className="game-container">
      <GameHeader timeLeft={timeLeft}/>
      {canPlay && (
        <GuessCard
          gameType={settings.game_type!}
          guess={currentBatch[currentGuess! % 10]!}
          submitter={submitGuess}
          incrementor={incrementGuess}
        />
      )}
      {!canPlay && <div className="loading">
        <div className="spinner"></div>
      </div>}
    </div>
  );
}

export default Game;
