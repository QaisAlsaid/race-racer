export enum EventType {
  CONNECT = "CONNECT",
  CONNECTION_RESPONSE = "CONNECTION_RESPONSE",
  CREATE_PARTY = "CREATE_PARTY",
  PARTY_CREATED = "PARTY_CREATED",
  JOIN_PARTY = "JOIN_PARTY",
  PARTY_JOINED = "PARTY_JOINED",
  LEAVE_PARTY = "LEAVE_PARTY",
  PARTY_STATE_UPDATE = "PARTY_STATE_UPDATE",
  SET_PARTY_SETTINGS = "SET_PARTY_SETTINGS",
  PARTY_SETTINGS_UPDATE = "PARTY_SETTINGS_UPDATE",
  GAME_START = "GAME_START",
  GAME_STARTED = "GAME_STARTED",
  GAME_END = "GAME_END",
  ROUND_START = "ROUND_START",
  ROUND_END = "ROUND_END",
  GUESS_MADE = "GUESS_MADE",
  REQUEST_GUESSES = "REQUEST_GUESSES",
  REQUEST_GUESSES_RESPONSE = "REQUEST_GUESSES_RESPONSE",
  GAME_STATE_UPDATE = "GAME_STATE_UPDATE",
  HEART_BEAT = "HEART_BEAT",
  CLOSING = "CLOSING",
  ERROR = "ERROR",
}

export function parseEventType(str: String) {
  switch (str) {
    case "CONNECT":
      return EventType.CONNECT;
    case "CONNECTION_RESPONSE":
      return EventType.CONNECTION_RESPONSE;
    case "CREATE_PARTY":
      return EventType.CREATE_PARTY;
    case "PARTY_CREATED":
      return EventType.PARTY_CREATED;
    case "JOIN_PARTY":
      return EventType.JOIN_PARTY;
    case "PARTY_JOINED":
      return EventType.PARTY_JOINED;
    case "LEAVE_PARTY":
      return EventType.LEAVE_PARTY;
    case "PARTY_STATE_UPDATE":
      return EventType.PARTY_STATE_UPDATE;
    case "SET_PARTY_SETTINGS":
      return EventType.SET_PARTY_SETTINGS;
    case "PART_SETTINGS_UPDATE":
      return EventType.PARTY_SETTINGS_UPDATE;
    case "GAME_START":
      return EventType.GAME_START;
    case "GAME_START_RESPONSE":
      return EventType.GAME_STARTED;
    case "GAME_END":
      return EventType.GAME_END;
    case "ROUND_START":
      return EventType.ROUND_START;
    case "ROUND_END":
      return EventType.ROUND_END;
    case "GUESS_MADE":
      return EventType.GUESS_MADE;
    case "REQUEST_GUESSES":
      return EventType.REQUEST_GUESSES;
    case "REQUEST_GUESSES_RESPONSE":
      return EventType.REQUEST_GUESSES_RESPONSE;
    case "GAME_STATE_UPDATE":
      return EventType.GAME_STATE_UPDATE;
    case "HEART_BEAT":
      return EventType.HEART_BEAT;
    case "CLOSING":
      return EventType.CLOSING;
    case "ERROR":
      return EventType.ERROR;
  }
  return EventType.ERROR;
}

export enum ErrorCode {
  BAD_JOIN = "BAD_JOIN",
  BAD_BATCH_INDEX = "BAD_BATCH_INDEX",
  BAD_START = "BAD_START",
  BAD_BATCH_REQUEST = "BAD_BATCH_REQUEST",
  BAD_LEAVE = "BAD_LEAVE",
  BAD_SCHEMA = "BAD_SCHEMA",
  BAD_PAYLOAD = "BAD_PAYLOAD",
  BAD_CLIENT_ID = "BAD_CLIENT_ID",
  BAD_GUESS = "BAD_GUESS",
  BAD_GUESS_SUBMIT = "BAD_GUESS_SUBMIT",
  BAD_SETTINGS = "BAD_SETTINGS",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
}

export function parseErrorCode(str: String) {
  switch (str) {
    case "BAD_JOIN":
      return ErrorCode.BAD_JOIN;
    case "BAD_BATCH_INDEX":
      return ErrorCode.BAD_BATCH_INDEX;
    case "BAD_START":
      return ErrorCode.BAD_START;
    case "BAD_BATCH_REQUEST":
      return ErrorCode.BAD_BATCH_REQUEST;
    case "BAD_LEAVE":
      return ErrorCode.BAD_LEAVE;
    case "BAD_SCHEMA":
      return ErrorCode.BAD_SCHEMA;
    case "BAD_PAYLOAD":
      return ErrorCode.BAD_PAYLOAD;
    case "BAD_CLIENT_ID":
      return ErrorCode.BAD_CLIENT_ID;
    case "BAD_GUESS":
      return ErrorCode.BAD_GUESS;
    case "BAD_GUESS_SUBMIT":
      return ErrorCode.BAD_GUESS_SUBMIT;
    case "BAD_SETTINGS":
      return ErrorCode.BAD_SETTINGS;
    case "INTERNAL_SERVER_ERROR":
      return ErrorCode.INTERNAL_SERVER_ERROR;
  }
  return ErrorCode.INTERNAL_SERVER_ERROR;
}

export enum ClosingCodes {
  OK = "OK",
  HEART_BEAT_TIMEOUT = "HEART_BEAT_TIMEOUT",
  NONE_JSON_MESSAGE = "NON_JSON_MESSAGE",
}

export function parseClosingCodes(str: String) {
  switch (str) {
    case "OK":
      return ClosingCodes.OK;
    case "HEART_BEAT_TIMEOUT":
      return ClosingCodes.HEART_BEAT_TIMEOUT;
    case "NON_JSON_MESSAGE":
      return ClosingCodes.NONE_JSON_MESSAGE;
  }
  return ClosingCodes.NONE_JSON_MESSAGE;
}

export enum AgeRanges {
  ZERO_TO_TWO = "ZERO_TO_TWO",
  THREE_TO_NINE = "THREE_TO_NINE",
  TEN_TO_NINETEEN = "TEN_TO_NINETEEN",
  TWENTY_TO_TWENTYNINE = "TWENTY_TO_TWENTYNINE",
  THIRTY_TO_THIRTYNINE = "THIRTY_TO_THIRTYNINE",
  FORTY_TO_FORTYNINE = "FORTY_TO_FORTYNINE",
  FIFTY_TO_FIFTYNINE = "FIFTY_TO_FIFTYNINE",
  SIXTY_TO_SIXTYNINE = "SIXTY_TO_SIXTYNINE",
  SEVENTY_TO_SEVENTYNINE = "SEVENTY_TO_SEVENTYNINE",
  EIGHTY_TO_EIGHTYNINE = "EIGHTY_TO_EIGHTYNINE",
  NINETY_TO_NINETYNINE = "NINETY_TO_NINETYNINE",
}

export function parseAgeRanges(str: String) {
  switch (str) {
    case "ZERO_TO_TWO":
      return AgeRanges.ZERO_TO_TWO;
    case "THREE_TO_NINE":
      return AgeRanges.THREE_TO_NINE;
    case "TEN_TO_NINETEEN":
      return AgeRanges.TEN_TO_NINETEEN;
    case "TWENTY_TO_TWENTYNINE":
      return AgeRanges.TWENTY_TO_TWENTYNINE;
    case "THIRTY_TO_THIRTYNINE":
      return AgeRanges.THIRTY_TO_THIRTYNINE;
    case "FORTY_TO_FORTYNINE":
      return AgeRanges.FORTY_TO_FORTYNINE;
    case "FIFTY_TO_FIFTYNINE":
      return AgeRanges.FIFTY_TO_FIFTYNINE;
    case "SIXTY_TO_SIXTYNINE":
      return AgeRanges.SIXTY_TO_SIXTYNINE;
    case "SEVENTY_TO_SEVENTYNINE":
      return AgeRanges.SEVENTY_TO_SEVENTYNINE;
    case "EIGHTY_TO_EIGHTYNINE":
      return AgeRanges.EIGHTY_TO_EIGHTYNINE;
    case "NINETY_TO_NINETYNINE":
      return AgeRanges.NINETY_TO_NINETYNINE;
  }
  return AgeRanges.ZERO_TO_TWO;
}

export function isAgeRange(value: any): value is AgeRanges {
  return Object.values(AgeRanges).includes(value);
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
}

export function parseGender(str: String) {
  return str === "MALE" ? Gender.MALE : Gender.FEMALE;
}

export function isGender(value: any): value is Gender {
  return Object.values(Gender).includes(value);
}

export enum Race {
  WHITE = "WHITE",
  BLACK = "BLACK",
  EAST_ASIAN = "EAST_ASIAN",
  SOUTHEAST_ASIAN = "SOUTHEAST_ASIAN",
  LATINO_HISPANIC = "LATINO_HISPANIC",
  MIDDLE_EASTERN = "MIDDLE_EASTERN",
  INDIAN = "INDIAN",
}

export function parseRace(str: String) {
  switch (str) {
    case "WHITE":
      return Race.WHITE;
    case "BLACK":
      return Race.BLACK;
    case "EAST_ASIAN":
      return Race.EAST_ASIAN;
    case "SOUTHEAST_ASIAN":
      return Race.SOUTHEAST_ASIAN;
    case "LATINO_HISPANIC":
      return Race.LATINO_HISPANIC;
    case "MIDDLE_EASTERN":
      return Race.MIDDLE_EASTERN;
    case "INDIAN":
      return Race.INDIAN;
  }
  return Race.WHITE;
}

export function isRace(value: any): value is Race {
  return Object.values(Race).includes(value);
}

export enum GameType {
  RACE = "RACE",
  AGE = "AGE",
  GENDER = "GENDER",
}

export function parseGameType(str: String) {
  switch (str) {
    case "RACE":
      return GameType.RACE;
    case "AGE":
      return GameType.AGE;
    case "GENDER":
      return GameType.GENDER;
  }
  return GameType.RACE;
}

export class BaseModel {
  [key: string]: any;

  constructor(defaults: Record<string, any> = {}) {
    Object.assign(this, defaults);
  }

  updateFromJSON(json: Record<string, any> = {}) {
    Object.entries(json).forEach(([key, value]) => {
      if (value === undefined) return;

      // @ts-ignore: dynamic assignment to typed property
      if (Array.isArray(value)) {
        this[key as keyof this] = [...value] as any;
      } else if (value && typeof value === "object") {
        this[key as keyof this] = {
          ...(this[key as keyof this] || {}),
          ...value,
        } as any;
      } else {
        this[key as keyof this] = value as any;
      }
    });
  }

  static fromJSON<T extends BaseModel>(
    this: new () => T,
    json: Record<string, any> = {}
  ): T {
    const instance = new this();
    instance.updateFromJSON(json);
    return instance;
  }
}

export class Player extends BaseModel {
  player_id: string = "";
  name: string = "";
  score: number = 0;
}

export class Guess extends BaseModel {
  url: string = "";
  age_range: AgeRanges = AgeRanges.ZERO_TO_TWO;
  gender: Gender = Gender.MALE;
  race: Race = Race.WHITE;

  updateFromJSON(json: Partial<Guess>) {
    super.updateFromJSON(json);
    this.url = json.url!;
    if (json.age_range !== undefined)
      this.age_range = parseAgeRanges(json.age_range);
    if (json.gender !== undefined) this.gender = parseGender(json.gender);
    if (json.race !== undefined) this.race = parseRace(json.race);
  }
}

export class Party extends BaseModel {
  party_id: string = "";
  host: string = "";
  players: Array<Player> = [];
  last_winners: Array<string> = [];

  constructor(
    party_id: string = "",
    host: string = "",
    players: Array<Player> = [],
    last_winners: Array<string> = []
  ) {
    super({});
    this.party_id = party_id;
    this.host = host;
    this.players = players;
    this.last_winners = last_winners;
  }
}

export class PartySettings extends BaseModel {
  game_type?: GameType;
  max_guesses?: number;
  max_score?: number;
  time?: number;
  constructor(
    game_type?: GameType,
    max_guesses?: number,
    max_score?: number,
    time?: number
  ) {
    super({});
    this.init(game_type, max_guesses, max_score, time);
  }

  init(
    game_type?: GameType,
    max_guesses?: number,
    max_score?: number,
    time?: number
  ) {
    if (game_type) this.game_type = game_type;
    if (max_guesses) this.max_guesses = max_guesses;
    if (max_score) this.max_score = max_score;
    if (time) this.time = time;
  }

  updateFromJSON(json: Record<string, any>): void {
    if (json !== undefined) {
      let game_type: GameType = GameType.RACE;
      let max_guesses = json.max_guesses;
      let max_score = json.max_score;
      let time = 60;
      if (json.game_type !== undefined) {
        game_type = parseGameType(json.game_type);
      }
      if (json.time !== undefined) {
        time = json.time;
      }
      this.init(game_type, max_guesses, max_score, time);
    }
  }
}

// export class Options extends BaseModel {
//   race_options?: Array<Race>;
//   age_options?: Array<AgeRanges>;
//   gender_options?: Array<Gender>;

//   constructor(race_options?: Array<Race>, age_options?: Array<AgeRanges>, gender_options?: Array<Gender>) {
//     super({});
//     this.init(race_options, age_options, gender_options);
//   }

//   init(race_options?: Array<Race>, age_options?: Array<AgeRanges>, gender_options?: Array<Gender>) {
//     if (race_options)
//       this.race_options = race_options;
//     else if (age_options)
//       this.age_options = age_options;
//     else if (gender_options)
//       this.gender_options = gender_options
//   }

//   updateFromJSON(json: Record<string, any>): void {
//     if (json.race_options && Array.isArray(json.race_options)) {
//       this.race_options = json.race_options.map((ro) => parseRace(ro));
//     } else if (json.age_options && Array.isArray(json.age_options)) {
//       this.age_options = json.age_options.map((ao) => parseAgeRanges(ao));
//     } else if (json.gender_options && Array.isArray(json.gender_options)) {
//       this.gender_options = json.gender_options.map((go) => parseGender(go));
//     }
//   }

//   static fromGameType(game_type: GameType) {
//     switch (game_type) {
//       case GameType.RACE:
//         return new Options(Object.values(Race))
//       case GameType.AGE:
//         return new Options(undefined, Object.values(AgeRanges))
//       case GameType.GENDER:
//         return new Options(undefined, undefined, Object.values(Gender))
//     }
//   }
// }

export class PlayerGuess extends BaseModel {
  index: number = 0;
  age_range?: AgeRanges;
  gender?: Gender;
  race?: Race;

  constructor(
    index: number = 0,
    age_range?: AgeRanges,
    gender?: Gender,
    race?: Race
  ) {
    super({});
    this.index = index;
    if (race) this.race = race;
    if (age_range) this.age_range = age_range;
    if (gender) this.gender = gender;
  }

  updateFromJSON(json: Record<string, any>) {
    super.updateFromJSON(json);
    this.index = json.index;
    if (json.age_range !== undefined)
      this.age_range = parseAgeRanges(json.age_range);
    if (json.gender !== undefined) this.gender = parseGender(json.gender);
    if (json.race !== undefined) this.race = parseRace(json.race);
  }
}

export class BaseResponsePayload extends BaseModel {
  client_id: string = "";
}

export class ConnectionResponsePayload extends BaseResponsePayload {
  heartbeat_interval: number = 0;
  heartbeat_timeout: number = 0;
}

export class ErrorPayload_ extends BaseResponsePayload {
  code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR;
  message: string = "";

  updateFromJSON(json: Record<string, any>) {
    super.updateFromJSON(json);
    if (json.code !== undefined) this.code = parseErrorCode(json.code);
  }
}

export class GuessesPayload extends BaseResponsePayload {
  batch: Array<Guess> = [];

  updateFromJSON(json: Record<string, any>) {
    const { batch, ...rest } = json;
    super.updateFromJSON(rest);
    if (batch !== undefined) {
      this.batch = batch.map((b: any) => {
        return Guess.fromJSON(b);
      });
    }
  }
}

export class PartyIdentificationPayload extends BaseResponsePayload {
  party_id: string = "";

  constructor(data: Partial<PartyIdentificationPayload>) {
    super({});
    super.updateFromJSON(data);
    this.party_id = data.party_id!;
  }
}

export class PartyCreationPayload extends BaseResponsePayload {
  player_name: string = "";

  constructor(data: Partial<PartyCreationPayload>) {
    super({});
    super.updateFromJSON(data);
    this.player_name = data.player_name!;
  }
}

export class PartyRegisterPayload extends PartyIdentificationPayload {
  player_name: string = "";

  constructor(data: Partial<PartyRegisterPayload>) {
    //super({data});
    super({});
    super.updateFromJSON(data);
    this.player_name = data.player_name!;
  }
}

export class GameStartedPayload extends PartyIdentificationPayload {
  guesses_batch_count: number = 0;
  initial_batch: Array<Guess> = [];
  constructor(data?: Partial<GameStartedPayload>) {
    //super({data});
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.guesses_batch_count = data.guesses_batch_count!;
    this.initial_batch = data.initial_batch!;
  }
}

export class RoundStartPayload extends PartyIdentificationPayload {
  initial_batch: Array<Guess> = [];
  constructor(data?: Partial<GameStartedPayload>) {
    //super({data});
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.initial_batch = data.initial_batch!;
  }
}

export class PartyPayload extends PartyIdentificationPayload {
  host: string = "";
  players: Array<Player> = [];
  last_winners: Array<string> = [];

  constructor(data?: Partial<PartyPayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.host = data.host!;
    this.players = data.players!;
    this.last_winners = data.last_winners!;
  }

  updateFromJSON(json: Record<string, any>) {
    const { players, ...rest } = json;
    super.updateFromJSON(rest);
    if (players !== undefined) {
      this.players = players.map((p: any) => {
        return Player.fromJSON(p);
      });
    }
  }
}

export class PartySettingsPayload extends PartyIdentificationPayload {
  settings: PartySettings = new PartySettings();

  constructor(data?: Partial<PartySettingsPayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.settings = data.settings!;
  }

  updateFromJson(json: Record<string, any>) {
    const { settings, ...rest } = json;
    super.updateFromJSON(rest);
    if (settings !== undefined) {
      this.settings.updateFromJSON(settings);
    }
  }
}

export class PartySettingsUpdatePayload extends PartyIdentificationPayload {
  settings: PartySettings = new PartySettings();
  // options: Options = new Options();

  constructor(data?: Partial<PartySettingsUpdatePayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.settings = data.settings!;
  }

  updateFromJSON(json: Record<string, any>): void {
    const { settings, options, ...rest } = json;
    super.updateFromJSON(rest);
    if (settings !== undefined) {
      this.settings.updateFromJSON(settings);
    }
    if (options !== undefined) {
      this.options.updateFromJSON(options);
    }
  }
}

export class PartyEnteredPayload extends PartyPayload {
  settings: PartySettings = new PartySettings();
  // options: Options = new Options();

  constructor(data?: Partial<PartyEnteredPayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.settings = data.settings!;
  }

  updateFromJSON(json: Record<string, any>): void {
    const { settings, options, ...rest } = json;
    super.updateFromJSON(rest);
    if (settings !== undefined) {
      this.settings.updateFromJSON(settings);
    }
    if (options !== undefined) {
      this.options.updateFromJSON(options);
    }
  }
}

export class PlayerGuessPayload extends PartyIdentificationPayload {
  guess: PlayerGuess = new PlayerGuess();

  constructor(data?: Partial<PlayerGuessPayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    if (data.guess) this.guess = data.guess;
  }

  updateFromJSON(json: Record<string, any>) {
    const { guess, ...rest } = json;
    super.updateFromJSON(rest);
    if (guess !== undefined) {
      this.guess = PlayerGuess.fromJSON(guess);
    }
  }
}

export class StatsPayload extends PartyIdentificationPayload {
  players: Array<Player> = [];
  players_guesses: Map<string, Array<PlayerGuess>> = new Map();
  guesses: Array<Guess> = [];
  winners: Array<string> = [];

  constructor(data?: Partial<StatsPayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.players = data.players!;
    this.players_guesses = data.players_guesses!;
    this.guesses = data.guesses!;
    this.winners = data.winners!;
  }

  updateFromJSON(json: Record<string, any>) {
    const { players, players_guesses, guesses, winners, ...rest } = json;
    super.updateFromJSON(rest);
    if (players !== undefined) {
      if (Array.isArray(players)) {
        let arr: Array<Player> = [];
        players.forEach((p) => {
          arr.push(p instanceof Player ? p : Player.fromJSON(p));
        });
        this.players = arr;
      }
    }
    if (players_guesses !== undefined) {
      for (const [playerId, guessList] of Object.entries(players_guesses)) {
        if (Array.isArray(guessList)) {
          let arr: Array<PlayerGuess> = [];
          guessList.forEach((g) => {
            arr.push(g instanceof PlayerGuess ? g : PlayerGuess.fromJSON(g));
          });
          this.players_guesses.set(playerId, arr);
        }
      }
    }
    if (guesses !== undefined) {
      if (Array.isArray(guesses)) {
        guesses.map((g) => {
          this.guesses.push(g);
        });
      }
    }
    if (winners !== undefined) {
      if (Array.isArray(winners)) {
        winners.map((w) => {
          this.winners.push(w);
        });
      }
    }
  }
}

export class RequestGuessesPayload extends PartyIdentificationPayload {
  new_batch_index: number = 0;
  constructor(data?: Partial<RequestGuessesPayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.new_batch_index = data.new_batch_index!;
  }
}

export class GameStatePayload extends PartyIdentificationPayload {
  scores: Map<string, number> = new Map();

  constructor(data?: Partial<GameStatePayload>) {
    super({});
    if (data === undefined) return;
    super.updateFromJSON(data);
    this.scores = data.scores!;
  }

  updateFromJSON(json: Record<string, any>) {
    const { scores, ...rest } = json;
    super.updateFromJSON(rest);
    for (const [playerId, score] of Object.entries(scores)) {
      this.scores.set(playerId, Number(score));
    }
  }
}

export class ClosingPayload extends BaseResponsePayload {
  code: ClosingCodes = ClosingCodes.OK;
  reason: string = "";
}

const eventPayloadMap = {
  [EventType.CONNECTION_RESPONSE]: BaseResponsePayload,
  [EventType.PARTY_CREATED]: PartyEnteredPayload,
  [EventType.PARTY_JOINED]: PartyEnteredPayload,
  [EventType.PARTY_STATE_UPDATE]: PartyPayload,
  [EventType.GAME_STARTED]: GameStartedPayload,
  [EventType.ROUND_START]: GameStartedPayload,
  [EventType.GAME_STATE_UPDATE]: GameStatePayload,
  [EventType.ROUND_END]: StatsPayload,
  [EventType.GAME_END]: StatsPayload,
  [EventType.PARTY_SETTINGS_UPDATE]: PartySettingsUpdatePayload,
  [EventType.REQUEST_GUESSES_RESPONSE]: GuessesPayload,
  [EventType.CLOSING]: ClosingPayload,
  [EventType.ERROR]: ErrorPayload_,
};

export class BaseEvent {
  event: EventType;
  data: BaseResponsePayload;

  constructor(event_type: EventType, payload: BaseResponsePayload) {
    this.event = event_type;
    this.data = payload;
  }
}

export function parseEvent(raw: Record<string, any>) {
  const payloadModel =
    eventPayloadMap[raw.event as keyof typeof eventPayloadMap];
  if (!payloadModel) throw new Error("received unsupported schema by frontend");
  const payload = payloadModel.fromJSON(raw.data);
  return new BaseEvent(raw.event, payload);
}
