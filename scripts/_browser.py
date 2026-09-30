"""
ZENITH PRO · shared browser launcher for the Python audits
---------------------------------------------------------------------------
Every audit needs a real Chromium. CI installs Playwright's own build; a laptop
usually has Chrome or Edge and no reason to download another. `launch()` uses, in
order: the channel named in ZENITH_BROWSER_CHANNEL, Playwright's bundled Chromium,
then an installed Chrome and Edge — so the same script runs unchanged in both places.
"""

import os
import sys


def utf8_output():
    """Greek text and typographic dashes must survive a redirected stdout on Windows (cp1252)."""
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")


def launch(playwright, **kwargs):
    wanted = os.environ.get("ZENITH_BROWSER_CHANNEL")
    attempts = ([wanted] if wanted else []) + [None, "chrome", "msedge"]
    last = None
    for channel in attempts:
        try:
            return playwright.chromium.launch(channel=channel, **kwargs) if channel else playwright.chromium.launch(**kwargs)
        except Exception as error:  # noqa: BLE001 — try the next candidate
            last = error
    raise RuntimeError(f"No Chromium available (tried {attempts}): {last}")
