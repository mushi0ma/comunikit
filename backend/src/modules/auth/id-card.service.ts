import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IdCardResult {
  valid: boolean;
  name?: string;
  validUntil?: string;
  reason?: string;
}

interface OcrParsed {
  name?: string;
  validUntil?: string;
  cardType?: string;
  university?: string;
  address?: string;
  isAituCard?: boolean;
  isExpired?: boolean;
}

@Injectable()
export class IdCardService {
  constructor(private readonly config: ConfigService) {}

  async verify(base64Image: string, mimeType: string): Promise<IdCardResult> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      return { valid: false, reason: 'OCR service not configured' };
    }

    const prompt = `You are verifying a student ID card from Astana IT University (AITUC/AITU), Kazakhstan.

Extract the following fields from the image:
- name: full name in Latin letters (two words, first name + last name)
- validUntil: expiry date in format DD.MM.YYYY
- cardType: should contain "STUDENT ID CARD"
- university: should contain "ASTANA IT"
- address: should contain "EXPO" or "Mangilik"

Respond ONLY with valid JSON, no markdown:
{
  "name": "...",
  "validUntil": "DD.MM.YYYY",
  "cardType": "...",
  "university": "...",
  "address": "...",
  "isAituCard": true/false,
  "isExpired": true/false
}`;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3.5-sonnet',
          max_tokens: 300,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`,
                  },
                },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      },
    );

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? '{}';

    let parsed: OcrParsed = {};
    try {
      parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as OcrParsed;
    } catch {
      return { valid: false, reason: 'Failed to parse OCR response' };
    }

    let isExpired = false;
    if (parsed.validUntil) {
      const [day, month, year] = parsed.validUntil.split('.');
      const expiry = new Date(+year, +month - 1, +day);
      isExpired = expiry < new Date();
    }

    const valid =
      parsed.isAituCard === true &&
      !isExpired &&
      !!parsed.name &&
      !!parsed.validUntil;

    return {
      valid,
      name: parsed.name,
      validUntil: parsed.validUntil,
      reason: !parsed.isAituCard
        ? 'Not an AITU card'
        : isExpired
          ? 'Card expired'
          : !parsed.name
            ? 'Could not read name'
            : undefined,
    };
  }
}
