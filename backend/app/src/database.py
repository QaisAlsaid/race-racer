import logging
from schema import AgeRanges, Gender, Race, Guess
import json
import requests
import os
import server_config as config


DATABASE_FILE_URL = "https://raw.githubusercontent.com/QaisAlsaid/RaceRacerData/refs/heads/master/images_wrapped.json"
IMAGES_BASE_URL = "https://raw.githubusercontent.com/QaisAlsaid/RaceRacerData/refs/heads/master/"

DATA_BASE_CACHE_FILE = "db.json"


class Database:
  def __init__(self):
    self.max_count: int = 0
    self.logger = logging.getLogger("server_logger.db")
    self.is_loaded = False;

  def load(self):
    self.logger.info("started loading database")
    path = os.path.join(config.DISK_CACHE_DIR, DATA_BASE_CACHE_FILE)
    if config.DISK_HAS_PERMISSION and os.path.exists(path):
        self.logger.info(f"started loading data base from file: {path}")
        self.logger.info("found cached data base file")
        with open(path, "r") as f:
          self.data = json.load(f)
        self.max_count = self.data["num_samples"]
        self.logger.info("done loading data base from file")
    else:
      self.logger.info("pulling data base from source")
      response = requests.get(DATABASE_FILE_URL)
      response.raise_for_status()
      self.data = response.json()
      self.max_count = self.data["num_samples"]
      self.logger.info("done pulling data base from source")
      if config.DISK_HAS_PERMISSION:
        self.logger.info(f"trying to cache pulled data to: {path}")
        with open(path, "w") as f:
          json.dump(self.data, f, indent=2);
        self.logger.info(f"cached pulled data: {path}")
    self.logger.info(f"done loading database, entries: {self.max_count}")
    self.is_loaded = True;

  def get_entry(self, index: int):
    if index > self.max_count:
      raise ValueError(f"index: {index} exceeds max_count: {self.max_count}")
    
    entry = self.data["images"][index]
    return Guess(
      url = IMAGES_BASE_URL + entry["file"],
      age_range = AgeRanges.from_string(entry["age"]),
      gender = Gender.from_string(entry["gender"]),
      race = Race.from_string(entry["race"]),
    )



_db: Database = Database()

def load():
  _db.load()
  return _db

def get():
  if not _db.is_loaded:
    raise ValueError("database is not loaded")

  return _db