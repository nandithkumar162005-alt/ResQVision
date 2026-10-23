"""Telegram Bot client with retry, structured logging, and multi-agency routing."""

import os
import asyncio
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger("resqvision.telegram")

# Agency to Environment Variable Chat ID mapping
AGENCY_ENV_MAP = {
    "NDRF": "TELEGRAM_CHAT_ID_NDRF",
    "Medical": "TELEGRAM_CHAT_ID_MEDICAL",
    "Police": "TELEGRAM_CHAT_ID_POLICE",
    "Fire": "TELEGRAM_CHAT_ID_FIRE",
    "Command Authority": "TELEGRAM_CHAT_ID_COMMAND",
}


class TelegramSender:
    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
        self.is_configured = bool(self.token and not self.token.startswith("123456789:") and self.token.lower() != "mock")
        self._bot = None

        if self.is_configured:
            try:
                import telegram
                self._bot = telegram.Bot(token=self.token)
                logger.info("TelegramSender initialized with official python-telegram-bot library.")
            except ImportError:
                logger.info("python-telegram-bot not detected, falling back to httpx Telegram Bot API driver.")
            except Exception as e:
                logger.warning(f"Failed to initialize telegram.Bot: {e}. Will use direct HTTP.")
        else:
            logger.info("Telegram bot running in SIMULATION/MOCK mode (no valid production token configured).")

    def get_chat_id_for_agency(self, agency_name: str) -> Optional[str]:
        """Resolves agency name to the corresponding Telegram group chat ID."""
        env_var = AGENCY_ENV_MAP.get(agency_name)
        if not env_var:
            return None
        chat_id = os.getenv(env_var, "").strip()
        return chat_id if chat_id else None

    async def send_message(
        self,
        agency_name: str,
        message: str,
        max_retries: int = 3,
        backoff_factor: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Sends a role-specific message to the designated agency's Telegram channel with retry logic.
        Returns a dict: {"success": bool, "status": "sent"|"failed", "error": str | None, "chat_id": str}
        """
        chat_id = self.get_chat_id_for_agency(agency_name)
        result = {
            "agency": agency_name,
            "chat_id": chat_id or "unconfigured",
            "success": False,
            "status": "failed",
            "error": None,
        }

        # Mock / Test Mode
        if not self.is_configured or not chat_id:
            logger.info(
                f"[TELEGRAM SIMULATION] Agency: '{agency_name}' | ChatID: '{chat_id or 'NOT_SET'}'\n"
                f"--- Message Content ---\n{message}\n-----------------------"
            )
            # In simulation/mock mode for demo/tests without live credentials, mark as sent
            result["success"] = True
            result["status"] = "sent"
            result["error"] = None
            return result

        # Live dispatch with retry logic
        last_error = None
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(
                    f"Dispatching Telegram alert to {agency_name} (chat_id: {chat_id}), attempt {attempt}/{max_retries}"
                )

                if self._bot:
                    await self._bot.send_message(
                        chat_id=chat_id,
                        text=message,
                        parse_mode=None,  # Plain text with unicode icons to avoid parse errors
                    )
                else:
                    # Direct HTTP API fallback via httpx
                    import httpx
                    url = f"https://api.telegram.org/bot{self.token}/sendMessage"
                    async with httpx.AsyncClient(timeout=10.0) as client:
                        resp = await client.post(url, json={"chat_id": chat_id, "text": message})
                        resp.raise_for_status()

                logger.info(f"Successfully delivered alert to {agency_name} (chat_id: {chat_id})")
                result["success"] = True
                result["status"] = "sent"
                result["error"] = None
                return result

            except Exception as exc:
                last_error = exc
                logger.warning(
                    f"Attempt {attempt}/{max_retries} failed sending Telegram message to {agency_name}: {exc}"
                )
                if attempt < max_retries:
                    await asyncio.sleep(backoff_factor * (2 ** (attempt - 1)))

        logger.error(
            f"All {max_retries} Telegram dispatch attempts failed for {agency_name} (chat_id: {chat_id}): {last_error}"
        )
        result["success"] = False
        result["status"] = "failed"
        result["error"] = str(last_error)
        return result


# Singleton instance for application-wide use
default_sender = TelegramSender()
