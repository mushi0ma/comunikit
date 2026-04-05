export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function openTelegramAuth(
  botUsername: string,
  onAuth: (user: TelegramUser) => void,
) {
  document.getElementById("tg-widget")?.remove();
  (window as unknown as { onTelegramAuth: (u: TelegramUser) => void }).onTelegramAuth = onAuth;
  const script = document.createElement("script");
  script.id = "tg-widget";
  script.src = "https://telegram.org/js/telegram-widget.js?22";
  script.setAttribute("data-telegram-login", botUsername);
  script.setAttribute("data-size", "large");
  script.setAttribute("data-onauth", "onTelegramAuth(user)");
  script.setAttribute("data-request-access", "write");
  script.async = true;
  document.head.appendChild(script);
}
