import server_config as config
config.load()
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from typing import Dict

from pydantic import Json
from heartbeat import sweep_dead_connections
import connection_manager as connman
from schema import ClosingCodes, ClosingPayload, Connection, BaseWebsocketEvent, ErrorPayload, ErrorCode, EventType, parse_event
from game_manager import GameManager
import database as db
from uuid import UUID
import logging 

logger: logging.Logger

def setup_logging():
  global logger
  logger = logging.getLogger("server_logger")
  logger.setLevel(config.LOGGING_LEVEL)
  logging_format = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
  if config.LOGGING_CONSOLE:
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(logging_format)
    logger.addHandler(console_handler)

  if config.LOGGING_FILE:
    import os
    from logging.handlers import RotatingFileHandler
    os.makedirs("log, exist_ok=True")
    file_handler = RotatingFileHandler("log/server.log", maxBytes=1_000_000, backupCount=3)
    file_handler.setFormatter(logging_format)
    logger.addHandler(file_handler)

app = FastAPI()

@app.on_event("startup")
async def startup_tasks():
  setup_logging()
  db.load()
  asyncio.create_task(sweep_dead_connections())

@app.get("/")
def get():
  return "";

async def on_error(client_id: UUID, code: ErrorCode, message: str):
  error_payload = ErrorPayload(
    client_id=client_id,
    code=code,
    message=message
  )
  error = BaseWebsocketEvent(data=error_payload, event=EventType.ERROR)
  await connman.get().broadcast_to_client(client_id=client_id, event=error)

async def on_closing(client_id: UUID, payload: ClosingPayload):
  close_event = BaseWebsocketEvent(event=EventType.CLOSING, data=payload)
  await connman.get().broadcast_to_client(client_id=client_id, event=close_event)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
  conn = await connman.get().connect(websocket)
  logger.debug(f"client: {conn.client_id} connected")
  try: 
    while True:
      #try:
        message_dict = await websocket.receive_json()
        event: BaseWebsocketEvent
        try:
          event = parse_event(message_dict)
          #event = BaseWebsocketEvent.model_validate_json(message_dict)
        except Exception as e:
          if e is WebSocketDisconnect: break
          logger.warning(f"received an unknown json schema from client: {conn.client_id}")
          await on_error(client_id=conn.client_id, code=ErrorCode.BAD_SCHEMA, message=str(e))
          continue
        await connman.get().on_message(event, conn.client_id)
  except WebSocketDisconnect:
    await connman.get().disconnect(conn.client_id)
    logger.debug(f"client: {conn.client_id} disconnected")
    return
  except Exception as e:
    logger.warning(f"received a non json formatted message from client: {conn.client_id}, exception: {e}")
    await on_error(client_id=conn.client_id, code=ErrorCode.BAD_PAYLOAD, message="invalid payload non json formatted")
    payload = ClosingPayload(client_id=conn.client_id, code=ClosingCodes.NON_JSON_MESSAGE, reason="received an invalid message not json formatted")
    await on_closing(client_id=conn.client_id, payload=payload)
    await connman.get().close_connection(conn.client_id)
