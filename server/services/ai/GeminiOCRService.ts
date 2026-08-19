import { GoogleGenAI } from '@google/genai';
import { logger } from '../../lib/logger';
import { CertificateExtraction, CertificateExtractionSchema } from './models';
import { CERTIFICATE_EXTRACTION_PROMPT } from './prompts';
import { OCRService } from './OCRService';

const MODEL = 'gemini-2.5-flash';
const MAX_ATTEMPTS = 3;

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
}

// Gemini-backed implementation. Activated by server/services/index.ts only when
// config.gemini.isConfigured is true; NoopOCRService (below) covers the pending-credentials
// case so nothing else in the app breaks while GEMINI_API_KEY is still unset.
export class GeminiOCRService implements OCRService {
  readonly isConfigured = true;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async extractCertificateFields(fileBuffer: Buffer, mimeType: string): Promise<CertificateExtraction> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: MODEL,
          contents: [{
            role: 'user',
            parts: [
              { text: CERTIFICATE_EXTRACTION_PROMPT },
              { inlineData: { mimeType, data: fileBuffer.toString('base64') } },
            ],
          }],
          config: { responseMimeType: 'application/json' },
        });
        const text = response.text;
        if (!text) throw new Error('Gemini returned an empty response.');
        const parsed = JSON.parse(stripCodeFences(text));
        return CertificateExtractionSchema.parse(parsed);
      } catch (err) {
        lastError = err;
        logger.warn({ err, attempt }, 'Certificate OCR extraction attempt failed');
      }
    }
    throw new Error(`Certificate OCR extraction failed after ${MAX_ATTEMPTS} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }
}

export class NoopOCRService implements OCRService {
  readonly isConfigured = false;

  async extractCertificateFields(): Promise<CertificateExtraction> {
    throw new Error('OCR is not available: GEMINI_API_KEY is not configured.');
  }
}
