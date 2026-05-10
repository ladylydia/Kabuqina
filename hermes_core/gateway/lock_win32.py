"""Cross-process gateway lock via Windows named mutex (CreateMutex).

Unlike ``msvcrt.locking`` / ``fcntl.flock``, a named mutex is a kernel
object.  Windows guarantees the mutex is released when the owning process
exits — no stale lock files, no unlink failures, no orphan byte-range
locks.  Same semantics as ``flock`` on Linux.

Functions mirror the public API of ``gateway.status`` so they can be
swapped in via a conditional import at module bottom.
"""

import ctypes
import os
from ctypes import wintypes
from pathlib import Path
from typing import Optional

_kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

_CreateMutexW = _kernel32.CreateMutexW
_CreateMutexW.argtypes = [wintypes.LPCVOID, wintypes.BOOL, wintypes.LPCWSTR]
_CreateMutexW.restype = wintypes.HANDLE

_CloseHandle = _kernel32.CloseHandle

_OpenMutexW = _kernel32.OpenMutexW
_OpenMutexW.argtypes = [wintypes.DWORD, wintypes.BOOL, wintypes.LPCWSTR]
_OpenMutexW.restype = wintypes.HANDLE

_ERROR_ALREADY_EXISTS = 183
_SYNCHRONIZE = 0x00100000
# Base name for the kernel mutex. When HERMESDESK_GATEWAY_PLATFORM is set
# (per-platform gateway child), the platform name is appended so that
# multiple gateway children (one per platform) can coexist without
# competing for the same kernel object.
_MUTEX_NAME_BASE = "Global\\hermes-gateway-runtime-lock"

_gateway_mutex_handle: Optional[int] = None
_mutex_name_cache: Optional[str] = None


def _resolved_mutex_name() -> str:
    """Return the mutex name, scoped per-platform when running as a gateway child.

    The host gateway (desktop, HERMESDESK_GATEWAY_PLATFORM not set) uses the
    original name so it still conflicts with any independent ``gateway run``
    the user might start from a terminal.
    """
    global _mutex_name_cache
    if _mutex_name_cache is not None:
        return _mutex_name_cache
    platform = os.environ.get("HERMESDESK_GATEWAY_PLATFORM")
    if platform:
        _mutex_name_cache = f"{_MUTEX_NAME_BASE}-{platform}"
    else:
        _mutex_name_cache = _MUTEX_NAME_BASE
    return _mutex_name_cache


def acquire_gateway_runtime_lock() -> bool:
    """Claim the cross-process runtime lock via a named Windows mutex.

    Returns True if the lock was acquired, False if another gateway
    already holds it.
    """
    global _gateway_mutex_handle
    if _gateway_mutex_handle is not None:
        return True

    name = _resolved_mutex_name()
    h = _CreateMutexW(None, True, name)
    if not h:
        return False
    if ctypes.get_last_error() == _ERROR_ALREADY_EXISTS:
        _CloseHandle(h)
        return False
    _gateway_mutex_handle = h
    return True


def release_gateway_runtime_lock() -> None:
    """Release the runtime lock when owned by this process."""
    global _gateway_mutex_handle
    if _gateway_mutex_handle is None:
        return
    _CloseHandle(_gateway_mutex_handle)
    _gateway_mutex_handle = None


def is_gateway_runtime_lock_active(
    lock_path: Optional[str] = None,
) -> bool:
    """Return True when some process currently owns the gateway mutex.

    The *lock_path* parameter is accepted for compatibility with the
    POSIX call site but ignored on Windows.
    """
    global _gateway_mutex_handle
    if _gateway_mutex_handle is not None:
        return True

    name = _resolved_mutex_name()
    h = _OpenMutexW(_SYNCHRONIZE, False, name)
    if h:
        _CloseHandle(h)
        return True
    return False
