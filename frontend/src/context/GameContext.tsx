import { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import { Guess, Party, PartySettings, PlayerGuess } from "../services/Schema.js";

export interface GameContext {
  party: Party;
  settings: PartySettings;
  scores: Map<string, number>;
  batchCount: number | undefined;
  currentGuess: number | undefined;
  currentBatchIndex: number | undefined;
  currentBatch: Array<Guess>;
  nextBatch: Array<Guess>;
  allGuesses: Array<Guess>;
  winners: Array<string>;
  allPlayersGuesses: Map<string, Array<PlayerGuess>>;
  setParty: React.Dispatch<React.SetStateAction<Party>>;
  setSettings: React.Dispatch<React.SetStateAction<PartySettings>>;
  setScores: React.Dispatch<React.SetStateAction<Map<string, number>>>;
  setBatchCount: React.Dispatch<React.SetStateAction<number | undefined>>; 
  setCurrentBatch: React.Dispatch<React.SetStateAction<Array<Guess>>>;
  setNextBatch: React.Dispatch<React.SetStateAction<Array<Guess>>>; 
  setCurrentGuess: React.Dispatch<React.SetStateAction<number | undefined>>;
  setCurrentBatchIndex: React.Dispatch<React.SetStateAction<number | undefined>>
  setAllGuesses: React.Dispatch<React.SetStateAction<Array<Guess>>>;
  setWinners: React.Dispatch<React.SetStateAction<Array<string>>>;
  setAllPlayersGuesses: React.Dispatch<React.SetStateAction<Map<string, Array<PlayerGuess>>>>;
  invalidate: React.Dispatch<React.SetStateAction<boolean>>;
}

interface GameProviderProps {
  children: ReactNode
}

const GameContext = createContext<GameContext | undefined>(undefined)

export const useGameContext = () => useContext(GameContext)

export const GameProvider = ({children}: GameProviderProps) => {

  const [party, setParty] = useState<Party>(new Party());
  const [settings, setSettings] = useState<PartySettings>(new PartySettings());
  const [scores, setScores] = useState<Map<string, number>>(new Map);
  const [batchCount, setBatchCount] = useState<number | undefined>(undefined);
  const [currentGuess, setCurrentGuess] = useState<number | undefined>(undefined);
  const [currentBatchIndex, setCurrentBatchIndex] = useState<number | undefined>(undefined);
  const [currentBatch, setCurrentBatch] = useState<Array<Guess>>([]);
  const [nextBatch, setNextBatch] = useState<Array<Guess>>([]);
  const [allGuesses, setAllGuesses] = useState<Array<Guess>>([]);
  const [winners, setWinners] = useState<Array<string>>([]);
  const [allPlayersGuesses, setAllPlayersGuesses] = useState<Map<string, Array<PlayerGuess>>>(new Map);
  const [_invalidate, invalidate] = useState<boolean>(false)

  useEffect(() => {
    if (_invalidate) {
    setParty(new Party);
    setSettings(new PartySettings());
    setScores(new Map);
    setBatchCount(undefined);
    setCurrentGuess(undefined);
    setCurrentBatchIndex(undefined);
    setCurrentBatch([]);
    setNextBatch([]);
    setAllGuesses([]);
    setWinners([]);
    setAllPlayersGuesses(new Map);
  }
  }, [_invalidate])

  return <GameContext.Provider value={{party, setParty, settings, setSettings, scores, setScores, batchCount, setBatchCount, currentBatch, setCurrentBatch, nextBatch, setNextBatch, currentGuess, setCurrentGuess, currentBatchIndex, setCurrentBatchIndex, allGuesses, setAllGuesses, winners, setWinners, allPlayersGuesses, setAllPlayersGuesses, invalidate}}>
    {children}
  </GameContext.Provider>
}