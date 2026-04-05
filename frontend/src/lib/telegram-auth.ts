export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Renders the Telegram Login Widget into a container element and registers
 * the auth callback. When the user completes Telegram auth inside the
 * widget iframe, `onAuth` fires with the user payload.
 */
export function initTelegramWidget(
  botUsername: string,
  onAuth: (user: TelegramUser) => void,
  containerId: string,
) {
  // Clear previous widget
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";

  // Register global callback that Telegram's script expects
  (window as unknown as { onTelegramAuth: (u: TelegramUser) => void }).onTelegramAuth = onAuth;

  const script = document.createElement("script");
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.setAttribute("data-telegram-login", botUsername);
  script.setAttribute("data-size", "large");
  script.setAttribute("data-radius", "8");
  script.setAttribute("data-onauth", "onTelegramAuth(user)");
  script.setAttribute("data-request-access", "write");
  script.async = true;
  container.appendChild(script);
}
