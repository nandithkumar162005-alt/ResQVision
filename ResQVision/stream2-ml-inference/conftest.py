"""
conftest.py — Pytest configuration for ResQVision Stream 2 tests.

Adds the project root to sys.path so that `from app.xxx import yyy` works
correctly when running pytest from the project root directory.
"""

import sys
from pathlib import Path

# Ensure the project root is on sys.path for all tests.
# This allows `from app.config import settings` etc. to work without
# installing the package in editable mode first.
project_root = Path(__file__).parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))
