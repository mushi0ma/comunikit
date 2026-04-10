import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface IdCardResult {
  isValid: boolean;
  extractedData: {
    name: string | null;
    studentId: string | null;
    expiryDate: string | null;
  };
  reason: string | null;
}

@Injectable()
export class IdCardService {
  constructor(private readonly config: ConfigService) {}

  async verify(imageBuffer: Buffer, mimeType: string): Promise<IdCardResult> {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');
    if (!apiKey) {
      return {
        isValid: false,
        extractedData: { name: null, studentId: null, expiryDate: null },
        reason: 'OCR service not configured',
      };
    }

    // Convert buffer → base64 data URL for OpenRouter Vision.
    // We intentionally do NOT persist the raw image anywhere (no Supabase
    // Storage, no local disk) — documents are used only for one-shot OCR.
    const base64Image = imageBuffer.toString('base64');

    const prompt = `You are a strict OCR verifier for Astana IT University (AITU) student ID cards.

The card is a HORIZONTAL plastic card. It may appear rotated in the photo — analyze it regardless of orientation.

Look for these elements:
1. Text "STUDENT ID CARD" on a green/teal side strip.
2. The logo and text "ASTANA IT UNIVERSITY" (or "AITU").
3. Student's full name in LATIN letters (e.g. "Sagyndyk Ramazan").
4. Expiry date in format "Valid until: DD.MM.YYYY" (e.g. "Valid until: 31.06.2027").
5. Address line containing "Astana" and keywords like "Mangilik El", "EXPO Pavilion", "block C1".
6. A student photo on the card.

Validation rules:
- The card MUST contain the AITU logo/text AND "STUDENT ID CARD" text to be valid.
- The expiry date must NOT be in the past (today is ${new Date().toISOString().split('T')[0]}).
- The name must be readable in Latin script.
- If there is a student ID number visible anywhere on the card, extract it. If not, return null for studentId.

Respond ONLY with this exact JSON structure, no markdown, no extra text:
{"isValid": true/false, "extractedData": {"name": "First Last", "studentId": "123456" or null, "expiryDate": "DD.MM.YYYY"}, "reason": null or "explanation if invalid"}`;

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-001',
          max_tokens: 400,
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

    if (!response.ok) {
      return {
        isValid: false,
        extractedData: { name: null, studentId: null, expiryDate: null },
        reason: `OCR API error: ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = data.choices?.[0]?.message?.content ?? '';

    let parsed: IdCardResult;
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned) as IdCardResult;
    } catch {
      return {
        isValid: false,
        extractedData: { name: null, studentId: null, expiryDate: null },
        reason: 'Failed to parse OCR response',
      };
    }

    // Server-side expiry re-check
    if (parsed.isValid && parsed.extractedData.expiryDate) {
      const parts = parsed.extractedData.expiryDate.split('.');
      if (parts.length === 3) {
        const expiry = new Date(+parts[2], +parts[1] - 1, +parts[0]);
        if (expiry < new Date()) {
          parsed.isValid = false;
          parsed.reason = 'Student ID card has expired';
        }
      }
    }

    return parsed;
  }
}
