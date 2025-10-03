import { useGameContext, type GameContext } from "../context/GameContext.js";

interface Props {
  timeLeft: number | undefined; 
}

const GameHeader: React.FC<Props> = ({timeLeft}) => {
  const { party, scores } = useGameContext() as GameContext;

  return (
    <div className="game-header">
      <div className="timer">{timeLeft !== undefined ? `${timeLeft}s` : "--"}</div>
      <div className="mini-scores">{party.players.map((p) => {
        return <div className="mini-score" key={p.player_id}>{p.name}: {scores.get(p.player_id) !== undefined ? scores.get(p.player_id) : 0}</div>
      })}</div>
    </div>
  );
}

export default GameHeader;