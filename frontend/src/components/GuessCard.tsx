import { useState } from "react";
import "../css/Game.css"
import {
  AgeRanges,
  GameType,
  Gender,
  Guess,
  parseAgeRanges,
  parseGender,
  parseRace,
  Race,
} from "../services/Schema.js";

interface Props {
  gameType: GameType;
  guess: Guess;
  submitter: Function;
  incrementor: Function
}

let cachedOption: Array<string> = Object.values(Race);
let cachedGameType: GameType = GameType.RACE;
function getOptionsFromGameType(gameType: GameType) {
  if (gameType === cachedGameType) {
    return cachedOption;
  } else {
    cachedGameType = gameType;
    switch (gameType) {
      case GameType.RACE: {
        cachedOption = Object.values(Race);
        break;
      }
      case GameType.AGE: {
        cachedOption = Object.values(AgeRanges);
        break;
      }
      case GameType.GENDER: {
        cachedOption = Object.values(Gender);
        break;
      }
    }
  }
  return cachedOption;
}

function getOptionParseFunction() {
  switch (cachedGameType) {
    case GameType.RACE:
      return parseRace;
    case GameType.AGE:
      return parseAgeRanges;
    case GameType.GENDER:
      return parseGender;
  }
}

function getMatching(guess: Guess, gameType: GameType) {
  switch(gameType) {
    case GameType.RACE: {
      return guess.race
    }
    case GameType.AGE: {
      return guess.age_range
    }
    case GameType.GENDER: {
      return guess.gender
    }
  }
}

const GuessCard: React.FC<Props> = ({ gameType, guess, submitter, incrementor }) => {
  const [feedback, setFeedback] = useState<{[key:string]: "correct" | "wrong"}>({})
  const [inTransitionState, setInTransitionState] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageErrored, setImageErrored] = useState(false);

  function handleClick(opt: string) {
    if (inTransitionState) return;
    setInTransitionState(true);
    const parsed = getOptionParseFunction()(opt);
    submitter(parsed)
    const isCorrect = parsed === getMatching(guess, gameType);
    setFeedback({[opt]: isCorrect ? "correct" : "wrong"});
    setTimeout(() => {
      incrementor()
      setFeedback({})
      setInTransitionState(false);
    }, 200);
  }

  return (
    <div className="guess-card">
      <img src={guess.url} alt="person image" onLoad={() => setImageLoaded(true)} onError={() => setImageErrored(true)} />
      {!imageLoaded && !imageErrored && <p className="loading-image"></p>}
      {imageErrored && <p className="image-error">Failed to load image</p>}
      
      { imageLoaded && !imageErrored && <ul className="options">
        {getOptionsFromGameType(gameType).map((opt) => (
          <li
          className={feedback[opt] || ""}
            key={opt}
            onClick={() => {
              handleClick(opt)
            }}
          >
            {opt}
          </li>
        ))}
      </ul>}
    </div>
  );
};

export default GuessCard;
