import asyncio

import logging
import time
import server_config as config
import connection_manager as connman
from schema import BaseWebsocketEvent, ClosingCodes, ClosingPayload, Connection, EventType

logger = logging.getLogger("server_logger.heartbeat")

async def sweep_dead_connections():
  while True:
    await asyncio.sleep(config.HB_SWEEP_INTERVAL)
    logger.info("starting sweep")
    now = time.time()
    to_close: list[Connection] = []
    async with connman.get().connection_lock:
      for conn in connman.get().active_connections.values():
        if now - conn.last_seen > config.HB_TIMEOUT:
          to_close.append(conn)
      for conn in to_close:
        payload = ClosingPayload(client_id=conn.client_id, code=ClosingCodes.HEART_BEAT_TIMEOUT, reason=f"inactive connection for: {now - conn.last_seen}")
        event = BaseWebsocketEvent(event=EventType.CLOSING, data=payload)
        await connman.get().broadcast_to_client(conn.client_id, event)
        try:
          await connman.get().close_connection_non_locked(conn.client_id)          
        except ValueError as e:
          logger.error(f"{e}")
          #await conn.websocket.close()
          #connman.get().active_connections.pop(conn.client_id)
    logger.info(f"finished sweep, closed {len(to_close)} connections")

