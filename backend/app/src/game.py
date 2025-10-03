from pydantic import config
import database
import random
from uuid import UUID
from typing import Dict, Optional
import asyncio
import connection_manager as connman
from schema import AgeRanges, BaseResponsePayload, Gender, Options, PartyIdentificationPayload, PartySettings, PartySettingsPayload, PartySettingsUpdatePayload, Player, Guess, PlayerGuessPayload, GuessesPayload, ErrorCode, BaseWebsocketEvent, Race, StatsPayload, EventType, GameStartedPayload, ErrorPayload, PlayerGuess, GameStatePayload, RequestGuessesPayload, GameType
import logging
import server_config as config
import math

class GamePlayer:
  def __init__(self, player_id: UUID, player_name: str, player_score: int):
    self.player_id = player_id
    self.player_name = player_name 
    self.player_score = player_score

  def to_player(self) -> Player:
    return Player(player_id=self.player_id, name=self.player_name, score=self.player_score)

class RoundInfo:
  def __init__(self, guess: PlayerGuess, current_score: int):
    self.guess = guess
    self.current_score = current_score

class LargestScorer:
  def __init__(self, player: UUID, score: int):
    self.player = player
    self.score = score

class Round:
  def __init__(self, guesses: Dict[UUID, list[RoundInfo]]):
    self.guesses = guesses
    self.winners: list[UUID]
    self.largest: LargestScorer | None = None

  def submit(self, player: UUID, guess: PlayerGuess, comp_guesses: list[Guess], game_type: GameType = GameType.RACE, max_guesses: Optional[int] = None):
    player_info = self.guesses.get(player)
    if player_info is None:
      return
    
    if max_guesses is not None:
      if len(player_info) > max_guesses:
        return

    correct = comp_guesses[guess.index]
    matching_guess = guess.get_from_game_type(game_type)
    if matching_guess is None:
      return
    
    last_score = player_info[-1].current_score if len(player_info) > 0 else 0
    if matching_guess == correct.get_from_game_type(game_type):
      last_score = last_score + 1 
    
    player_info.append(RoundInfo(guess=guess, current_score=last_score))

  def to_dict(self) -> Dict[UUID, list[PlayerGuess]]:
    d: Dict[UUID, list[PlayerGuess]] = {}
    for k, v in self.guesses.items():
      l:list[PlayerGuess] = []
      for i in v:
        l.append(i.guess)
      d[k] = l
    return d


class Game:
  def __init__(self, game_id: UUID, host: UUID, hostname: str):
    self.players: Dict[UUID, GamePlayer] = { host:GamePlayer(player_id=host, player_name=hostname, player_score=0) }
    self.host: UUID = host
    self.game_id: UUID = game_id
    self._guesses: list[Guess] = []
    self._guesses_per_batch = 10
    self.round_task = None
    self.round_active = None
    self.round_duration = 10
    self.update_task = None
    self.grace_ignore_task = None
    self.in_grace_period = False
    self.update_duration = 1
    self._current_round: Round | None = None
    self._previous_round: Round | None = None
    self.max_score: Optional[int] = None
    self.max_guesses: Optional[int] = None
    self.game_type: GameType = GameType.RACE
    self.exclude = []
    self.started: bool = False
    self.largest: LargestScorer | None = None;
    self.logger: logging.Logger = logging.getLogger(f"server_logger.game")

    self.mutate_lock = asyncio.Lock()


  async def set_settings(self, settings: PartySettings):
    if self.round_active:
      await self.on_error(f"can't change settings while round is active", self.host, ErrorCode.BAD_SETTINGS);
      return
    db = database.get()
    if settings.time and settings.time < 10:
      await self.on_error(f"time too low: {settings.time}s < min_time: {10}", self.host, ErrorCode.BAD_SETTINGS);
      return
    elif settings.time and settings.time > 3600:
      await self.on_error(f"time too high: {settings.time}s > max_time: {3600}", self.host, ErrorCode.BAD_SETTINGS);
      return
    elif settings.time:
      self.round_duration = settings.time
    if settings.max_score and settings.max_score < 1:
      await self.on_error(f"max_score too low: {settings.max_score} < min_max_score: {1}", self.host, ErrorCode.BAD_SETTINGS);
      return
    elif settings.max_score and settings.max_score > 500:
      await self.on_error(f"max_score too high: {settings.max_score} > max_max_score: {500}", self.host, ErrorCode.BAD_SETTINGS);
      return
    elif settings.max_score:
      self.max_score = settings.max_score
    if settings.max_guesses and settings.max_guesses < 5:
      await self.on_error(f"max_guesses too low: {settings.max_guesses} < min_max_guesses: {5}", self.host, ErrorCode.BAD_SETTINGS);
      return
    elif settings.max_guesses and settings.max_guesses > db.max_count:
      await self.on_error(f"max_guesses too high: {settings.max_guesses} > max_max_guesses: {db.max_count}", self.host, ErrorCode.BAD_SETTINGS);
      return
    elif settings.max_guesses:
      self.max_guesses = settings.max_guesses
    if settings.game_type:
      self.game_type = settings.game_type
    
    return PartySettings(game_type=self.game_type, max_guesses=self.max_guesses, max_score=self.max_score, time=self.round_duration);

  def get_settings(self): 
    return PartySettings(game_type=self.game_type, max_guesses=self.max_guesses, max_score=self.max_score, time=self.round_duration);

  def get_players(self):
    players = []
    for p in self.players.values():
      players.append(p.to_player())
    return players;

  def add_player(self, player_id: UUID, player_name: str):
    player = GamePlayer(player_id=player_id, player_name=player_name, player_score=0)
    self.players[player_id] = player

  def remove_player(self, player_id: UUID):
    del self.players[player_id]

  def ensure_guess(self, index: int) -> Guess:
    try: 
      return self._get_guess(index)
    except Exception as e:
      return self._append_guess(index)

  async def ensure_guesses_batch(self, index: int, client_id: UUID) -> list[Guess]:
    start = index * self._guesses_per_batch;
    end = start + self._guesses_per_batch;
    if self.max_guesses and end > math.ceil(self.max_guesses/10) * 10:
      await self.on_error(
        f"requested guess: { end } is larger than max guesses: { self.max_guesses }", 
        client_id, ErrorCode.BAD_BATCH_INDEX
      )
      return [];
    try:
      #if index + 1 * self._guesses_per_batch > len(self._guesses):
      if end > len(self._guesses):
        return self._append_batch(index)
      return self._get_batch(index)
    except Exception as e:
      await self.on_error(str(e), client_id, ErrorCode.BAD_BATCH_INDEX)
      return []

  def _append_batch(self, index: int) -> list[Guess]:
    arr = []
    start = index * self._guesses_per_batch
    end = start + self._guesses_per_batch;
    for i in range(start, end):
      arr.append(self._append_guess(i))
    
    return arr

  def _get_batch(self, index: int) -> list[Guess]:
    arr = []
    start = index * self._guesses_per_batch
    end = start + self._guesses_per_batch;
    for i in range(start, end):
      arr.append(self._get_guess(i))
    
    return arr

  @staticmethod
  def random_exclude(start, end, excluded):
      excluded = sorted(excluded)
      total = end - start + 1 - len(excluded)
      r = random.randint(0, total-1)
      for ex in excluded:
          if r >= ex - start:
              r+=1;
          else:
              break;
      return start + r;

  def _append_guess(self, index: int) -> Guess:
    db = database.get()
    #idx = random.randint(0, db.max_count)
    idx = Game.random_exclude(1, db.max_count, self.exclude)
    guess = db.get_entry(idx)
    #if index != len(self._guesses):
    #  raise ValueError("index: {index} not equal to max: {}", len(self._guesses))
    self._guesses.append(guess)
    number = (guess.url.split("/")[-1]).split(".")[0]
    self.exclude.append(int(number))
    return guess

  def _get_guess(self, index: int) -> Guess:
    if index >= len(self._guesses):
      raise ValueError(f"guess index: {index} out of range: {len(self._guesses)}")
    return self._guesses[index]

  def _create_empty_round(self) -> Round:
    d = {}
    for key in self.players.keys():
      d[key] = []
    return Round(guesses=d)

  async def start_round(self, is_first_round: bool):
    self.logger.info("starting round")
    if self.round_task and not self.round_task.done():
      self.round_task.cancel()
    
    if self.update_task and not self.update_task.done():
      self.update_task.cancel()

    if self.largest and self.max_score and self.largest.score >= self.max_score:
      await self.on_error("game is over, because max score is reached", self.host, ErrorCode.BAD_START);
      return
    
    self.current_round = self._create_empty_round()

    for player in self.players:
      guesses = await self.ensure_guesses_batch(0, player)
      
      if is_first_round:
        payload = GameStartedPayload(
          client_id=player,
          party_id=self.game_id,
          guesses_batch_count = self._guesses_per_batch,
          initial_batch=guesses
        )

        event = BaseWebsocketEvent(
          event=EventType.GAME_STARTED,
          data=payload,
        )
      else:
        payload = GuessesPayload(
          client_id=player,
          batch=guesses,
        )
        event = BaseWebsocketEvent(
          event=EventType.ROUND_START,
          data=payload
        )

      await connman.get().broadcast_to_client(player, event)

    self.round_active = True
    self.round_task = asyncio.create_task(self._round_timer())
    self.update_task = asyncio.create_task(self._update_timer())

  def isolate_the_winners(self):
    for player, info in self.current_round.guesses.items():
      if len(info) > 0:
        final_score = info[-1].current_score
        if self.current_round.largest is None: self.current_round.largest = LargestScorer(player=player, score=final_score)
        if final_score > self.current_round.largest.score:
          self.current_round.largest = LargestScorer(player=player, score=final_score)
    

    winners = []
    for player, info in self.current_round.guesses.items():
      if self.current_round.largest is not None:
        if len(info) > 0 and info[-1].current_score == self.current_round.largest.score:
          winners.append(player)
          self.players[player].player_score += 1;
          score = self.players[player].player_score
          if self.largest is None: self.largest = LargestScorer(player=player, score=score)
          if score > self.largest.score:
            self.largest = LargestScorer(player=player, score=score)

    self.current_round.winners = winners    

  async def end_round(self):
    self.logger.info(f"ending round: {self.game_id}")
    if not self.round_active:
      return
    if self.update_task and not self.update_task.done():
      self.update_task.cancel()
    self.round_active = False
    
    try:
      self.isolate_the_winners()
    except Exception as e:
      self.logger.error(e); 

    players = []
    for p in self.players.values():
      print (p.player_score)
      players.append(p.to_player())

    for player in self.players:
      payload = StatsPayload(
        client_id=player,
        party_id=self.game_id,
        players=players,
        players_guesses=self.current_round.to_dict(),
        winners=self.current_round.winners,
        guesses=self._guesses
      )
      if self.max_score and self.largest and self.largest.score >= self.max_score: game_over = True
      else: game_over = False
      event = BaseWebsocketEvent(
        event = EventType.ROUND_END if not game_over else EventType.GAME_END,
        data=payload
      )
      await connman.get().broadcast_to_client(player, event)
      
    self.previous_round = self.current_round
    self._guesses = []

    self.in_grace_period = True
    if self.grace_ignore_task and not self.grace_ignore_task.done():
      self.grace_ignore_task.cancel()
    self.grace_ignore_task = asyncio.create_task(self._grace_timer())

  async def _grace_timer(self):
    try:
      await asyncio.sleep(config.GAME_GRACE_IGNORE_PERIOD)
      self.in_grace_period = False
    except asyncio.CancelledError:
      pass

  async def _round_timer(self):
    try:
      await asyncio.sleep(self.round_duration)
      async with self.mutate_lock:
        await self.end_round()
    except asyncio.CancelledError:
      self.logger.error(f"round cancelled early")
      return

  async def _update_timer(self):
    try:
      await asyncio.sleep(self.update_duration)
      await self.update()
    except asyncio.CancelledError:
      self.logger.debug("update cancelled")

  async def update(self):
    scores = {}
    for player, info in self.current_round.guesses.items():
      if len(info) > 0:
        final_score = info[-1].current_score
      else:
        final_score = 0
      scores[player] = final_score

    for id, player in self.players.items():
      payload = GameStatePayload(
        client_id=id,
        party_id=self.game_id,
        scores=scores
      )
      event = BaseWebsocketEvent(event=EventType.GAME_STATE_UPDATE, data=payload)
      await connman.get().broadcast_to_client(client_id=id, event=event);
    
    if self.update_task and not self.update_task.done():
      self.update_task.cancel()
    self.update_task = asyncio.create_task(self._update_timer())


  async def start(self):
    self.started = True
    # for player in self.players:
    #   payload = GameStartedPayload(
    #     client_id=player,
    #     party_id=self.game_id,
    #     guesses_batch_count = self._guesses_per_batch,
    #     batch=
    #   )

    #   event = BaseWebsocketEvent(
    #     event=EventType.GAME_STARTED,
    #     data=payload,
    #   )
    #   await connman.get().broadcast_to_client(player, event)

    self.logger.info(f"starting game: {self.game_id}, host: {self.host}")
    async with self.mutate_lock:
      await self.start_round(True)

  async def on_guess_submit(self, client_id: UUID, data: PlayerGuessPayload):
    self.logger.info(f"player: {client_id} requested to submit a guess")

    if self.in_grace_period:
      self.logger.info(f"ignoring player: {client_id}, guess submit");
      return

    if not self.round_active:
      await self.on_error("there is no active round", client_id, ErrorCode.BAD_GUESS_SUBMIT)
      self.logger.warning(f"failed to submit guess for player {client_id}, reason: there is no active round")
      return
    
    player_info = self.current_round.guesses.get(client_id)
    if player_info is None:
      await self.on_error("player not in round", client_id, ErrorCode.BAD_GUESS_SUBMIT)
      self.logger.warning(f"failed to submit guess for player {client_id}, reason: player is not in round")
      return

    if data.guess.index > len(self._guesses):
      await self.on_error(f"guess index: {data.guess.index} out of range", client_id, ErrorCode.BAD_GUESS_SUBMIT)
      self.logger.warning(f"failed to submit guess for player {client_id}, reason: guess index: {data.guess.index} out of range: {len(self._guesses)}")
      return
    if self.max_guesses and data.guess.index > self.max_guesses:
      await self.on_error(f"guess index: {data.guess.index} greater than max guesses: {self.max_guesses}", client_id, ErrorCode.BAD_GUESS_SUBMIT)
      self.logger.warning(f"failed to submit guess for player {client_id}, reason: guess index: {data.guess.index} greater than max guesses {self.max_guesses}")
      return

    async with self.mutate_lock:
      self.current_round.submit(client_id, data.guess, self._guesses)
      self.logger.info(f"player: {client_id} submitted a guess sucsefully")
  
  async def on_guesses_request(self, client_id: UUID, data: RequestGuessesPayload):
    self.logger.info(f"player: {client_id} requested a guess batch")
    if self.in_grace_period:
      self.logger.info(f"ignoring player: {client_id}, guess batch request");
      return
    if not self.round_active:
      await self.on_error("no active round", client_id, ErrorCode.BAD_BATCH_REQUEST)
      self.logger.warning(f"failed to supply a batch to player: {client_id}, reason: no active round")
      return
    async with self.mutate_lock:
      batch = await self.ensure_guesses_batch(index=data.new_batch_index, client_id=client_id)
    payload = GuessesPayload(client_id=client_id, batch=batch)
    event = BaseWebsocketEvent(event=EventType.REQUEST_GUESSES_RESPONSE, data=payload)
    await connman.get().broadcast_to_client(client_id=client_id, event=event)

  async def on_round_start(self, client_id: UUID, data: PartyIdentificationPayload):
    self.logger.info(f"player: {client_id} requested a round start")
    async with self.mutate_lock:
      if self.round_active:
        await self.on_error("round already started", client_id, ErrorCode.BAD_START)
        self.logger.warning(f"failed to start round for player: {client_id}, reason: round already started")
        return 
      if client_id == self.host:
        await self.start_round(False)
        return
      await self.on_error("only host can initiate a round", client_id, ErrorCode.BAD_START)
      self.logger.warning(f"failed to start round for player: {client_id}, reason: player not a host")

  async def on_settings_set(self, client_id: UUID, data: PartySettingsPayload):
    self.logger.info(f"player: {client_id} requested a settings change")
    async with self.mutate_lock:
      if client_id == self.host:
        settings = await self.set_settings(data.settings)
        if settings:
          for player in self.players:
            payload = PartySettingsUpdatePayload(client_id=player, party_id=self.game_id, settings=settings)
            event = BaseWebsocketEvent(event=EventType.PARTY_SETTINGS_UPDATE, data=payload);
            await connman.get().broadcast_to_client(client_id=player, event=event);
        return
      await self.on_error("only host can set the party settings", client_id, ErrorCode.BAD_SETTINGS);
      self.logger.warning(f"failed to set settings for player: {client_id}, reason: player not a host")
      

  async def on_message(self, message: BaseWebsocketEvent, client_id: UUID):
    if client_id not in self.players:
      return

    if message.event == EventType.ROUND_START:
      if not self.started:
        await self.on_error(f"game: {self.game_id} can't starts round before it starts", client_id, ErrorCode.BAD_START)
        return
      await self.on_round_start(client_id, message.data)
      return

    if message.event == EventType.REQUEST_GUESSES:
      await self.on_guesses_request(client_id, message.data)
      return
    
    if message.event == EventType.GUESS_MADE:
      await self.on_guess_submit(client_id, message.data)
      return

    if message.event == EventType.SET_PARTY_SETTINGS:
      await self.on_settings_set(client_id, message.data);
      return

  async def on_disconnect(self, client_id: UUID) -> bool:
    self.logger.debug(f"on disconnect: {client_id}")
    async with self.mutate_lock:
      if client_id not in self.players:
        return False

      self.logger.info(f"client: {client_id} disconnected out of game: {self.game_id}")
      del self.players[client_id]

      if len(self.players) == 0:
        return True

      if client_id == self.host:
          next: UUID 
          for next in self.players: break

          self.host = next
          self.logger.info(f"changed host to: {next}, game: {self.game_id}")

      return False

  async def on_error(self, e: str, client_id: UUID, code: ErrorCode):
    error_payload = ErrorPayload(
      client_id=client_id,
      code = code,
      message=e
    )
    error_response = BaseWebsocketEvent(data=error_payload, event=EventType.ERROR)
    await connman.get().broadcast_to_client(client_id, error_response)
