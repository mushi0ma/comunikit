import * as crypto from 'crypto';

export function verifyTelegramAuth(
  data: Record<string, unknown>,
  botToken: string,
): boolean {
  const { hash, ...rest } = data;
  if (typeof hash !== 'string') return false;
  const checkString = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${String(rest[k])}`)
    .join('\n');
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(checkString)
    .digest('hex');
  return hmac === hash;
}
