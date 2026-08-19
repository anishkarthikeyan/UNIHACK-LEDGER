import { GoogleGenAI } from '@google/genai';
import { logger } from '../../lib/logger';
import { AIVerificationService } from './AIVerificationService';
import { AuthenticityResult, AuthenticityResultSchema, CertificateExtraction, CompetitionRecordForVerification } from './models';
import { certificateAuthenticityPrompt } from './prompts';

const MODEL = 'gemini-2.5-flash';
const MAX_ATTEMPTS = 3;

function stripCodeFences(text: string): string {
  return text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
}

export class GeminiVerificationService implements AIVerificationService {
  readonly isConfigured = true;
  private readonly client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async scoreAuthenticity(extraction: CertificateExtraction, candidates: CompetitionRecordForVerification[]): Promise<AuthenticityResult> {
    const prompt = certificateAuthenticityPrompt(
      { studentName: extraction.studentName, competitionName: extraction.competitionName, date: extraction.date, organizer: extraction.organizer },
      candidates,
    );
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const response = await this.client.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });
        const text = response.text;
        if (!text) throw new Error('Gemini returned an empty response.');
        const parsed = JSON.parse(stripCodeFences(text));
        const result = AuthenticityResultSchema.parse(parsed);
        // Defense in depth: even if the model claims a match, only trust it if that id is
        // actually one of the candidates we sent — never let the model hallucinate a hackathon
        // id that then gets treated as a real match downstream.
        if (result.matchedHackathonId && !candidates.some((c) => c.id === result.matchedHackathonId)) {
          return { ...result, matchedHackathonId: null, flags: [...result.flags, 'Model referenced a hackathon not in the candidate list — discarded.'] };
        }
        return result;
      } catch (err) {
        lastError = err;
        logger.warn({ err, attempt }, 'Certificate authenticity scoring attempt failed');
      }
    }
    throw new Error(`Certificate authenticity scoring failed after ${MAX_ATTEMPTS} attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
  }
}

export class NoopAIVerificationService implements AIVerificationService {
  readonly isConfigured = false;

  async scoreAuthenticity(): Promise<AuthenticityResult> {
    throw new Error('AI verification is not available: GEMINI_API_KEY is not configured.');
  }
}
