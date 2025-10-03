import logging
import os
import sys
import time

# logging
LOGGING_CONSOLE: bool
LOGGING_FILE: bool
LOGGING_LEVEL = logging.DEBUG

# heartbeat
HB_INTERVAL: int
HB_TIMEOUT: int
HB_SWEEP_INTERVAL: int

# db
DB_CACHE: bool

# game
GAME_GRACE_IGNORE_PERIOD: int

# disk
DISK_HAS_PERMISSION: bool
DISK_BASE_DIR: str
DISK_CACHE_DIR: str
DISK_LOGGING_DIR: str
DISK_CWD: str = ""

def get_bool(env_var: str, default: bool) -> bool:
  var = os.getenv(env_var);
  if var is None:
    return default;
  
  var = var.lower();
  return True if var == 'true' or var == 'yes' else False;

def get_str(env_var: str, default: str) -> str:
  return os.getenv(env_var, default).lower();

def get_int(env_var: str, default: int) -> int:
  var = os.getenv(env_var);
  if var is None:
    return default;
  try:
    return int(var)
  except:
    return default

def log_level_from_string(lvl_str: str):
  if lvl_str == "debug": return logging.DEBUG
  if lvl_str == "info": return logging.INFO;
  if lvl_str == "warn": return logging.WARNING;
  if lvl_str == "error": return logging.ERROR;
  if lvl_str == "critical": return logging.CRITICAL;

def get_env_vars():
  globals().update(
    DISK_HAS_PERMISSION = get_bool("RR_SERVER_DISK_HAS_DISK_PERMISSION", False),
    DISK_BASE_DIR = get_str("RR_SERVER_DISK_BASE_DIR", "rr/"),
    LOGGING_CONSOLE = get_bool("RR_SERVER_LOGGING_ENABLE_CONSOLE", True),
    LOGGING_FILE = get_bool("RR_SERVER_LOGGING_ENABLE_FILE", False),
  )
  globals().update(
    DB_CACHE = get_bool("RR_SERVER_DB_CACHE", True if DISK_HAS_PERMISSION else False),
    LOGGING_LEVEL = log_level_from_string(get_str("RR_SERVER_LOGGING_LEVEL", "debug")),
    HB_INTERVAL = get_int("RR_SERVER_HB_INTERVAL", 40),
    HB_TIMEOUT = get_int("RR_SERVER_HB_TIMEOUT", 240),
    HB_SWEEP_INTERVAL = get_int("RR_SERVER_HB_SWEEP_INTERVAL", 40),
    GAME_GRACE_IGNORE_PERIOD = get_int("RR_SERVER_GAME_GRACE_IGNORE_PERIOD", 1),
  )


def set_dirs_based_on_base():
  if DISK_BASE_DIR is not None:
    globals().update(
      DISK_CACHE_DIR = DISK_BASE_DIR + "cache/",
      DISK_LOGGING_DIR = DISK_BASE_DIR + "log/",
    )


def setup_dirs():
  global DISK_CWD
  set_dirs_based_on_base()
  if DISK_HAS_PERMISSION is not None and DISK_HAS_PERMISSION:
    DISK_CWD = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."));
    os.chdir(DISK_CWD)
    print(f"{time.time()} - changed working directory to: {DISK_CWD}")
    sys.path.append(DISK_CWD)
    print(f"{time.time()} - appended CWD to sys path")
    os.makedirs(DISK_BASE_DIR, exist_ok=True);
    print(f"{time.time()} - made base directory: {DISK_BASE_DIR}")
    os.makedirs(DISK_CACHE_DIR, exist_ok=True);
    print(f"{time.time()} - made cache directory: {DISK_CACHE_DIR}")
    os.makedirs(DISK_LOGGING_DIR, exist_ok=True)
    print(f"{time.time()} - made logging directory: {DISK_LOGGING_DIR}")


def load():
  print(f"{time.time()} - started loading server config")
  get_env_vars()
  setup_dirs()
  print(f"{time.time()} - done loading server config")