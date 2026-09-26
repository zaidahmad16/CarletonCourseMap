import atexit
import os
import threading
import time

import psycopg2
from psycopg2 import extensions, pool
from dotenv import load_dotenv

load_dotenv()

# Opening a new connection to Neon costs ~250 ms, while the queries themselves
# take under 2 ms. Reusing connections from a pool removes that cost from every
# request. Endpoints keep calling get_connection() / conn.close() exactly as
# before; close() now hands the connection back to the pool instead.

POOL_MIN = int(os.getenv("DB_POOL_MIN", "1"))
POOL_MAX = int(os.getenv("DB_POOL_MAX", "10"))
# Neon can drop idle connections (e.g. when compute suspends). A connection that
# has sat unused longer than this is pinged before being handed out.
STALE_AFTER_SECONDS = float(os.getenv("DB_POOL_STALE_SECONDS", "60"))

_pool = None
_pool_lock = threading.Lock()
# Blocks callers when every connection is in use, instead of the pool raising.
_slots = threading.BoundedSemaphore(POOL_MAX)
_last_used = {}


def _get_pool():
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = pool.ThreadedConnectionPool(
                    POOL_MIN,
                    POOL_MAX,
                    dsn=os.getenv("DATABASE_URL"),
                    keepalives=1,
                    keepalives_idle=30,
                    keepalives_interval=10,
                    keepalives_count=3,
                )
    return _pool


def _is_alive(conn):
    if conn.closed:
        return False
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        conn.rollback()
        return True
    except psycopg2.Error:
        return False


class PooledConnection:
    """Wraps a pooled psycopg2 connection. Everything is passed through to the
    real connection except close(), which returns it to the pool."""

    def __init__(self, pool_, conn):
        self._pool = pool_
        self._conn = conn

    def __getattr__(self, name):
        if self._conn is None:
            raise psycopg2.InterfaceError("connection already returned to pool")
        return getattr(self._conn, name)

    def close(self):
        conn, self._conn = self._conn, None
        if conn is None:
            return
        broken = bool(conn.closed)
        if not broken:
            try:
                # psycopg2 opens a transaction on the first query. Roll back
                # anything left open so the next request starts clean.
                if conn.get_transaction_status() != extensions.TRANSACTION_STATUS_IDLE:
                    conn.rollback()
            except psycopg2.Error:
                broken = True
        _last_used.pop(id(conn), None)
        if not broken:
            _last_used[id(conn)] = time.monotonic()
        try:
            self._pool.putconn(conn, close=broken)
        finally:
            _slots.release()

    def __del__(self):
        # Safety net if an endpoint ever forgets to close.
        try:
            self.close()
        except Exception:
            pass


def get_connection():
    _slots.acquire()
    try:
        p = _get_pool()
        # If Neon dropped several idle connections at once, keep discarding
        # until we get a live one. After POOL_MAX tries every idle connection
        # has been replaced, so the next one is freshly opened.
        for _ in range(POOL_MAX + 1):
            conn = p.getconn()
            idle_for = time.monotonic() - _last_used.get(id(conn), 0)
            if not conn.closed and (idle_for <= STALE_AFTER_SECONDS or _is_alive(conn)):
                break
            _last_used.pop(id(conn), None)
            p.putconn(conn, close=True)
        else:
            conn = p.getconn()
        _last_used[id(conn)] = time.monotonic()
        return PooledConnection(p, conn)
    except BaseException:
        _slots.release()
        raise


@atexit.register
def _close_pool():
    if _pool is not None:
        _pool.closeall()
