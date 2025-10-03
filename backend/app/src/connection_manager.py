import asyncio
from uuid import UUID
from typing import Dict
from fastapi import WebSocket
from schema import Connection, EventType, BaseWebsocketEvent, ConnectionResponsePayload, ErrorPayload, ErrorCode
import message_bus
import logging
import server_config as config

class ConnectionManager:
  def __init__(self):
    self.active_connections: Dict[UUID, Connection] = {}
    self.logger = logging.getLogger("server_logger.connection_manager")
    self.connection_lock = asyncio.Lock()
    self.send_lock = asyncio.Lock()

  async def connect(self, websocket: WebSocket, message_callback = None) -> Connection:
    async with self.connection_lock:
      await websocket.accept()
      conn = Connection(websocket=websocket)
      self.active_connections[conn.client_id] = conn

    conn_response_payload = ConnectionResponsePayload(
      client_id = conn.client_id,
      heartbeat_interval=config.HB_INTERVAL,
      heartbeat_timeout=config.HB_TIMEOUT
    )

    websocket_response = BaseWebsocketEvent(
      event=EventType.CONNECTION_RESPONSE,
      data=conn_response_payload
    )

    await self.broadcast_to_client(conn.client_id, websocket_response)
    return conn

  async def disconnect(self, client_id: UUID) -> None:
    async with self.connection_lock:
      await message_bus.get().dispatch_disconnect(client_id)
      del self.active_connections[client_id]

  async def on_message(self, message: BaseWebsocketEvent, client_id: UUID) -> None:
    conn = self.validate_client(message.data.client_id)
    if not conn or client_id != message.data.client_id:
      await self.on_error(f"invalid client_id in payload: {message.data.client_id}", client_id, ErrorCode.BAD_CLIENT_ID)
      self.logger.warning(f"invalid client_id: {message.data.client_id} in payload: {message}")
      return
    conn = Connection(client_id=conn.client_id, websocket=conn.websocket)
    async with self.connection_lock:
      self.active_connections[conn.client_id] = conn;
    await message_bus.get().dispatch(message, client_id)

  async def broadcast_to_client(self, client_id: UUID, event: BaseWebsocketEvent) -> None:
    conn = self.active_connections.get(client_id)
    if conn is None:
      return
    async with self.send_lock:
      await conn.websocket.send_text(event.model_dump_json())

  def get_active_connections(self) -> list[UUID]:
    return list(self.active_connections.keys())

  def validate_client(self, client_id: UUID) -> Connection | None:
    return self.active_connections.get(client_id);

  async def close_connection(self, client_id: UUID):
    async with self.connection_lock:
      await self.close_connection_non_locked(client_id=client_id)

  async def close_connection_non_locked(self, client_id: UUID):
    #await message_bus.get().dispatch_disconnect(client_id=client_id)
    conn = self.active_connections.get(client_id)
    if conn is None:
      raise ValueError(f"trying to close invalid connection: {client_id}")
    try:
      await conn.websocket.close()
    except Exception as e:
      self.logger.error(f"websocket closing exception {e}", exc_info=True)

  async def on_error(self, e: str, client_id: UUID, code: ErrorCode):
    error_payload = ErrorPayload(
      client_id=client_id,
      code = code,
      message=e
    )
    error_response = BaseWebsocketEvent(data=error_payload, event=EventType.ERROR)
    await self.broadcast_to_client(client_id, error_response)

__conn_man = ConnectionManager()

def get() -> ConnectionManager:
  return __conn_man

def set(conn_man: ConnectionManager):
  __conn_man = conn_man
