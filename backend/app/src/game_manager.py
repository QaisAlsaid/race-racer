import logging
import uuid
from uuid import UUID
import connection_manager as connman
import message_bus
from typing import Dict
from message_bus import Subscriber
from game import Game
from schema import ErrorPayload, BaseWebsocketEvent, EventType, ErrorCode, PartyEnteredPayload, PartyIdentificationPayload, PartyPayload, PartyRegisterPayload, Player, PartyCreationPayload
import asyncio

class GameManager:
  def __init__(self):
    self.active_games: Dict[UUID, Game] = {}
    self.subscription_id = message_bus.get().add_subscriber(Subscriber(_on_message=self.on_message, _on_disconnect=self.on_disconnect))
    self.mutate_lock = asyncio.Lock()
    self.logger = logging.getLogger("server_logger.game_manger")

  def create_game(self, host: UUID, hostname: str) -> UUID:
    game_id = uuid.uuid4()
    self.active_games[game_id] = Game(game_id, host, hostname)
    return game_id

  def join_game(self, game_id: UUID, player: UUID, player_name: str):
    game = self.active_games.get(game_id)
    if game is None:
      raise ValueError(f"invalid game id: {game_id}")

    if player in game.players:
      raise ValueError(f"player: {player} already in the party")
    
    if game.round_active:
      raise ValueError(f"game already started")

    game.add_player(player_id = player, player_name=player_name)
    self.logger.info(f"player: [{player_name}: {player}] joined game: {game_id}")


  def leave_game(self, game_id: UUID, player: UUID):
    game = self.active_games.get(game_id)
    if game is None:
      raise ValueError(f"invalid game id: {game_id}")
    
    if player in game.players:
      game.remove_player(player)
      self.logger.info(f"player: {player} left game: {game_id}")
      if player == game.host:
        if len(game.players) == 0: # no more active players, kill the game
          del self.active_games[game_id]
          self.logger.info(f"closing game {game_id}: no more players")
        else: # change the host
          for next in game.players: break
          game.host = next
          self.logger.info(f"player: {player} is the new host for game: {game_id}")
      return;
      
    raise ValueError(f"player: {player} not in party")

  async def on_error(self, e: str, client_id: UUID, code: ErrorCode):
    error_payload = ErrorPayload(
      client_id=client_id,
      code = code,
      message=e
    )
    error_response = BaseWebsocketEvent[ErrorPayload](data=error_payload, event=EventType.ERROR)
    await connman.get().broadcast_to_client(client_id, error_response)

  async def on_party_create(self, message: BaseWebsocketEvent[PartyCreationPayload], client_id: UUID):
    await self.leave_if_in_party(client_id)
    data = message.data
    async with self.mutate_lock:
      game_id = self.create_game(client_id, data.player_name)
    game = self.active_games[game_id]
    self.logger.info(f"created party id: {game_id}, host: {client_id}")
    response_payload = PartyEnteredPayload(
      client_id = client_id,
      party_id=game_id,
      players=game.get_players(),
      host=game.host,
      settings=game.get_settings(),
    )

    response = BaseWebsocketEvent(
      event=EventType.PARTY_CREATED,
      data=response_payload
    )

    await connman.get().broadcast_to_client(client_id, response)

  async def leave_if_in_party(self, client_id: UUID):
    player_to_kill = None
    for game in self.active_games.values():
      for player in game.players:
        if player == client_id:
          player_to_kill = player
    
    if player_to_kill:
      async with self.mutate_lock:
        self.leave_game(game.game_id, client_id);

  async def on_party_join(self, message: BaseWebsocketEvent[PartyRegisterPayload], client_id: UUID):
    await self.leave_if_in_party(client_id)

    data = message.data
    try:
      self.join_game(data.party_id, client_id, data.player_name)
    except Exception as e:
      await self.on_error(str(e), client_id, ErrorCode.BAD_JOIN)
      return

    game = self.active_games.get(data.party_id)

    if game is None:
      await self.on_error(f"invalid game id: {data.party_id}", client_id, ErrorCode.BAD_JOIN)
      return


    await self.on_party_join_broadcast(game=game, joiner=client_id)
    await self.on_party_state_change(game=game, exclude=client_id)

  async def on_party_leave(self, message: BaseWebsocketEvent[PartyRegisterPayload], client_id: UUID):
    data = message.data
    try:
      async with self.mutate_lock:
        self.leave_game(data.party_id, client_id)
    except Exception as e:
      await self.on_error(str(e), client_id, ErrorCode.BAD_LEAVE)
      return

    game = self.active_games.get(data.party_id)

    if game is None:
      await self.on_error(f"invalid game id: {data.party_id}", client_id, ErrorCode.BAD_JOIN)
      return

    await self.on_party_state_change(game=game)
  
  async def on_party_join_broadcast(self, game: Game, joiner: UUID):
    response_payload = PartyEnteredPayload(
      client_id = joiner,
      party_id=game.game_id,
      players=game.get_players(),
      host=game.host,
      settings=game.get_settings(),
    )

    response = BaseWebsocketEvent(
      event=EventType.PARTY_JOINED,
      data=response_payload
    )

    await connman.get().broadcast_to_client(joiner, response)

  async def on_party_state_change(self, game: Game, exclude: UUID | None = None):
    players = []

    for p in game.players.values():
      players.append(Player(player_id=p.player_id, name=p.player_name, score=p.player_score))

    winners = []
    if game._previous_round is not None:
      winners = game._previous_round.winners

    for player in game.players.keys():
      if exclude and player == exclude: continue;
      response_payload = PartyPayload(
        client_id = player,
        party_id=game.game_id,
        players=players,
        host=game.host,
        last_winners=winners
      )

      response = BaseWebsocketEvent(
        event=EventType.PARTY_STATE_UPDATE,
        data=response_payload
      )

      await connman.get().broadcast_to_client(player, response)

  async def on_game_start(self, message: BaseWebsocketEvent[PartyIdentificationPayload], client_id: UUID):
    data = message.data
    try:
      await self.start_game(data.party_id, client_id)
    except Exception as e:
      await self.on_error(str(e), client_id, ErrorCode.BAD_START)
      return


  #TODO(Qais): ts pmo, having to dispatch each message to all games
  #update: partially fixed, not bad at all
  async def on_message(self, message: BaseWebsocketEvent, client_id: UUID):
    event = message.event
    if event == EventType.CREATE_PARTY:
      await self.on_party_create(message, client_id)
      return
    if event == EventType.JOIN_PARTY:
      await self.on_party_join(message, client_id)
      return
    if event == EventType.LEAVE_PARTY:
      await self.on_party_leave(message, client_id)
    if event == EventType.GAME_START:
      await self.on_game_start(message, client_id)
      return

    if isinstance(message.data, PartyIdentificationPayload):
      for game in self.active_games.values():    
        await game.on_message(message, client_id)

  async def on_disconnect(self, client_id: UUID):
    self.logger.debug(f"on disconnect: {client_id}")
    delete_game = None
    async with self.mutate_lock:
      for key, game in self.active_games.items():
        if await game.on_disconnect(client_id=client_id):
          delete_game = key
          break
      
      if delete_game:
        self.logger.info(f"closing game, {delete_game}")
        del self.active_games[delete_game]

  async def start_game(self, game_id: UUID, client_id: UUID):
    game = self.active_games.get(game_id)
    if game is None:
      raise ValueError(f"invalid game id: {game_id}")
    if game.host != client_id:
      raise ValueError(f"only host can initiate game start, game: {game_id}")
    # if game.started:
    #   raise ValueError(f"game: {game_id} already started")
    await game.start()


_game_manager = GameManager()

def get() -> GameManager:
  return _game_manager
