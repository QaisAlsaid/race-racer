import uuid
from uuid import UUID
from typing import Dict, Callable, Awaitable
from schema import BaseWebsocketEvent

class Subscriber:
  def __init__(self, _on_message, _on_disconnect):
    self.on_message = _on_message
    self.on_disconnect = _on_disconnect

  on_message: Callable[[BaseWebsocketEvent, UUID], Awaitable[None]]
  on_disconnect: Callable[[UUID], Awaitable[None]]

class MessageBus:
  def __init__(self):
    self.subscribers: Dict[UUID, Subscriber] = {}

  def add_subscriber(self, subscriber: Subscriber) -> UUID:
    sub_id = uuid.uuid4()
    sub = self.subscribers.get(sub_id)
    if sub is not None:
      raise ValueError(f"id: {sub_id} already a subscriber")
    self.subscribers[sub_id] = subscriber
    return sub_id

  async def dispatch(self, message: BaseWebsocketEvent, client_id: UUID):
    for subscriber in self.subscribers.values():
      if subscriber.on_message:
        await subscriber.on_message(message, client_id)

  async def dispatch_disconnect(self, client_id: UUID):
    for subscriber in self.subscribers.values():
      if subscriber.on_disconnect:
        await subscriber.on_disconnect(client_id)

_message_bus = MessageBus()

def get():
  return _message_bus;