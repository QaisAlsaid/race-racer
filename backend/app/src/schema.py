from enum import Enum
import uuid
from uuid import UUID
from datetime import date, datetime
import string
import json
from pydantic import BaseModel, Field, ConfigDict, InstanceOf, UUID4, AliasGenerator
from pydantic.alias_generators import to_snake
from typing import Dict, Any, Optional, TypeVar, Generic
from fastapi import WebSocket
import time

class Connection(BaseModel):
  client_id: UUID = Field(default_factory=uuid.uuid4)
  last_seen: float = Field(default_factory=time.time)
  websocket: InstanceOf[WebSocket]
  model_config = ConfigDict(arbitrary_types_allowed=True, frozen=True)


class EventType(str, Enum):
  CONNECT = "CONNECT"
  CONNECTION_RESPONSE = "CONNECTION_RESPONSE"
  CREATE_PARTY = "CREATE_PARTY"
  PARTY_CREATED = "PARTY_CREATED"
  JOIN_PARTY = "JOIN_PARTY"
  PARTY_JOINED = "PARTY_JOINED"
  LEAVE_PARTY = "LEAVE_PARTY"
  PARTY_STATE_UPDATE = "PARTY_STATE_UPDATE"
  GAME_START = "GAME_START"
  SET_PARTY_SETTINGS = "SET_PARTY_SETTINGS"
  PARTY_SETTINGS_UPDATE = "PARTY_SETTINGS_UPDATE"
  GAME_STARTED = "GAME_STARTED"
  GAME_END = "GAME_END"
  ROUND_START = "ROUND_START"
  ROUND_END = "ROUND_END"
  GUESS_MADE = "GUESS_MADE"
  REQUEST_GUESSES = "REQUEST_GUESSES"
  REQUEST_GUESSES_RESPONSE = "REQUEST_GUESSES_RESPONSE"
  GAME_STATE_UPDATE = "GAME_STATE_UPDATE"
  HEART_BEAT = "HEART_BEAT"
  CLOSING = "CLOSING"
  ERROR = "ERROR"

class ErrorCode(str, Enum):
  BAD_JOIN = "BAD_JOIN"
  BAD_BATCH_INDEX = "BAD_BATCH_INDEX"
  BAD_START = "BAD_START"
  BAD_BATCH_REQUEST = "BAD_BATCH_REQUEST"
  BAD_LEAVE = "BAD_LEAVE"
  BAD_SCHEMA = "BAD_SCHEMA"
  BAD_PAYLOAD = "BAD_PAYLOAD"
  BAD_CLIENT_ID = "BAD_CLIENT_ID"
  BAD_GUESS_SUBMIT = "BAD_GUESS_SUBMIT"
  BAD_SETTINGS = "BAD_SETTINGS"
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"

class ClosingCodes(str, Enum):
  OK = "OK"
  HEART_BEAT_TIMEOUT = "HEART_BEAT_TIMEOUT"
  NON_JSON_MESSAGE = "NON_JSON_MESSAGE"

class AgeRanges(str, Enum):
  ZERO_TO_TWO = "ZERO_TO_TWO"
  THREE_TO_NINE = "THREE_TO_NINE"
  TEN_TO_NINETEEN = "TEN_TO_NINETEEN"
  TWENTY_TO_TWENTYNINE = "TWENTY_TO_TWENTYNINE"
  THIRTY_TO_THIRTYNINE = "THIRTY_TO_THIRTYNINE"
  FORTY_TO_FORTYNINE = "FORTY_TO_FORTYNINE"
  FIFTY_TO_FIFTYNINE = "FIFTY_TO_FIFTYNINE"
  SIXTY_TO_SIXTYNINE = "SIXTY_TO_SIXTYNINE"
  SEVENTY_TO_SEVENTYNINE = "SEVENTY_TO_SEVENTYNINE"
  EIGHTY_TO_EIGHTYNINE = "EIGHTY_TO_EIGHTYNINE"
  NINETY_TO_NINETYNINE = "NINETY_TO_NINETYNINE"

  @staticmethod
  def from_string(range: str):
    if range[0] == '0': return AgeRanges.ZERO_TO_TWO;
    if range[0] == '3': return AgeRanges.THREE_TO_NINE;
    if range[0] == '1': return AgeRanges.TEN_TO_NINETEEN;
    if range[0] == '2': return  AgeRanges.TWENTY_TO_TWENTYNINE;
    if range[0] == '3': return  AgeRanges.THIRTY_TO_THIRTYNINE;
    if range[0] == '4': return  AgeRanges.FORTY_TO_FORTYNINE;
    if range[0] == '5': return  AgeRanges.FIFTY_TO_FIFTYNINE;
    if range[0] == '6': return  AgeRanges.SIXTY_TO_SIXTYNINE;
    if range[0] == '7': return  AgeRanges.SEVENTY_TO_SEVENTYNINE;
    if range[0] == '8': return  AgeRanges.EIGHTY_TO_EIGHTYNINE;
    # fallback
    return  AgeRanges.NINETY_TO_NINETYNINE;


# yes there are only TWO GENDERS!
# wanna fight about it?
class Gender(str, Enum):
  MALE = "MALE"
  FEMALE = "FEMALE"

  @staticmethod
  def from_string(gender: str):
    lg = gender.lower()
    if lg == "male": return Gender.MALE;
    # fallback
    return Gender.FEMALE

class Race(str, Enum):
  WHITE = "WHITE"
  BLACK = "BLACK"
  EAST_ASIAN = "EAST_ASIAN"
  SOUTHEAST_ASIAN = "SOUTHEAST_ASIAN"
  LATINO_HISPANIC = "LATINO_HISPANIC"
  MIDDLE_EASTERN = "MIDDLE_EASTERN"
  INDIAN = "INDIAN"

  @staticmethod
  def from_string(race: str):
    lr = race.lower()
    if lr == "white": return Race.WHITE;
    if lr == "black": return Race.BLACK;
    if lr == "east asian": return Race.EAST_ASIAN;
    if lr == "southeast asian": return Race.SOUTHEAST_ASIAN;
    if lr == "latino_hispanic": return Race.LATINO_HISPANIC;
    if lr == "middle eastern": return Race.MIDDLE_EASTERN;
    # fallback
    return Race.INDIAN;

class GameType(str, Enum):
  RACE = "RACE"
  AGE = "AGE"
  GENDER = "GENDER"

PayloadT = TypeVar("PayloadT", bound=BaseModel)

# base class for any response
class BaseResponsePayload(BaseModel):
  client_id: UUID
  model_config = ConfigDict(alias_generator=AliasGenerator(serialization_alias=to_snake), frozen=True)

# the only event class
class BaseWebsocketEvent(BaseModel, Generic[PayloadT]):
  event: EventType
  data: PayloadT
  time: datetime = Field(default_factory=datetime.now)
  model_config = ConfigDict(use_enum_values=True, frozen=True)

# the payload that gets sent after connection  
class ConnectionResponsePayload(BaseResponsePayload):
  heartbeat_interval: int
  heartbeat_timeout: int

# payload on errors
class ErrorPayload(BaseResponsePayload):
  code: ErrorCode
  message: str

# guess with correct answers 
class Guess(BaseModel):
  url: str
  age_range: AgeRanges
  gender: Gender
  race: Race


  def get_from_game_type(self, game_type: GameType):
    if game_type == GameType.RACE:
      return self.race
    if game_type == GameType.AGE:
      return self.age_range
    if game_type == GameType.GENDER:
      return self.gender

# batch of guesses
class GuessesPayload(BaseResponsePayload):
  batch: list[Guess]

# this becomes the base class after party creation/join (while in a party)
class PartyIdentificationPayload(BaseResponsePayload):
  party_id: UUID

class PartyCreationPayload(BaseResponsePayload):
  player_name: str

class PartyRegisterPayload(PartyIdentificationPayload):
  player_name: str

class PartySettings(BaseModel):
  game_type: Optional[GameType] = GameType.RACE
  max_guesses: Optional[int] = None
  max_score: Optional[int] = None
  time: Optional[int] = None

class Options(BaseModel):
  race_options: Optional[list[Race]] = None
  age_options: Optional[list[AgeRanges]] = None
  gender_options: Optional[list[Gender]] = None

  @staticmethod
  def set_from_type(type):
    arr = []
    for elem in type: 
      arr.append(elem)
    if type is Race:
      return Options(race_options=arr)
    if type is AgeRanges:
      return Options(age_options=arr);
    if type is Gender:
      return Options(gender_options=arr);
    raise    

class PartySettingsPayload(PartyIdentificationPayload):
  settings: PartySettings

class PartySettingsUpdatePayload(PartyIdentificationPayload):
  settings: PartySettings

# player identification class
class Player(BaseModel):
  player_id: UUID
  name: str
  score: int = 0

# party with its info, gets sent after join or when party state changes
class PartyPayload(PartyIdentificationPayload):
  players: list[Player]
  host: UUID
  last_winners: list[UUID] = []

# gets send after party creation with the event PARTY_CREATED
# and after party join with the event PARTY_JOINED
class PartyEnteredPayload(PartyPayload):
  settings: PartySettings;

# a guess made by a player
class PlayerGuess(BaseModel):
  index: int
  age_range: Optional[AgeRanges] = None
  gender: Optional[Gender] = None
  race: Optional[Race] = None

  def get_from_game_type(self, game_type: GameType):
    if game_type == GameType.RACE:
      return self.race
    if game_type == GameType.AGE:
      return self.age_range
    if game_type == GameType.GENDER:
      return self.gender

class PlayerGuessPayload(PartyIdentificationPayload):
  guess: PlayerGuess

# only gets sent when the first round starts  
class GameStartedPayload(PartyIdentificationPayload):
  guesses_batch_count: int
  initial_batch: list[Guess]

# gets send after round ends
class StatsPayload(PartyIdentificationPayload):
  players: list[Player]
  players_guesses: Dict[UUID, list[PlayerGuess]]
  guesses: list[Guess]
  winners: list[UUID]


# when player requests a batch of guesses
class RequestGuessesPayload(PartyIdentificationPayload):
  new_batch_index: int

# the update payload
class GameStatePayload(PartyIdentificationPayload):
  scores: Dict[UUID, int] #current round score 

class ClosingPayload(BaseResponsePayload):
  code: ClosingCodes
  reason: str

event_payload_map = {
  EventType.CREATE_PARTY: PartyCreationPayload,
  EventType.JOIN_PARTY: PartyRegisterPayload,
  EventType.LEAVE_PARTY: PartyRegisterPayload,
  EventType.PARTY_STATE_UPDATE: PartyPayload,
  EventType.SET_PARTY_SETTINGS: PartySettingsPayload,
  EventType.GAME_START: PartyIdentificationPayload,
  EventType.ROUND_START: PartyIdentificationPayload,
  EventType.GUESS_MADE: PlayerGuessPayload,
  EventType.REQUEST_GUESSES: RequestGuessesPayload,
  EventType.HEART_BEAT: BaseResponsePayload
}

def parse_event(raw: dict) -> BaseWebsocketEvent:
  event_type = EventType(raw["event"])
  payload_model = event_payload_map.get(event_type)
  if payload_model is None:
    raise ValueError(f"invalid schema, no model found for event: {raw["event"]}")
  payload = payload_model.model_validate(raw["data"])
  return BaseWebsocketEvent[payload_model](
    event=event_type,
    data=payload
  )
