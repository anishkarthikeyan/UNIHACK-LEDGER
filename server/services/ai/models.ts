import { z } from 'zod';

// Structured shape the certificate parser must return. Used both to constrain Gemini's JSON
// output and to validate it before anything downstream trusts it — an LLM response is untrusted
// input like any other, even when you asked it nicely to return JSON.
export const CertificateExtractionSchema = z.object({
  studentName: z.string().nullable(),
  competitionName: z.string().nullable(),
  date: z.string().nullable(), // ISO date if the model can normalize it, otherwise raw text
  organizer: z.string().nullable(),
  certificateNumber: z.string().nullable(),
  rawText: z.string(), // full OCR text, kept for audit/debugging even when fields fail to parse
});
export type CertificateExtraction = z.infer<typeof CertificateExtractionSchema>;

// Output of comparing an extraction against stored competition records. Faculty makes the final
// call — see AIVerificationService's docstring — this is a decision aid, not an auto-approval.
export const AuthenticityResultSchema = z.object({
  score: z.number().min(0).max(100),
  matchedHackathonId: z.string().nullable(),
  reasons: z.array(z.string()),
  flags: z.array(z.string()), // things that look off — mismatched date, no matching record, etc.
});
export type AuthenticityResult = z.infer<typeof AuthenticityResultSchema>;

export interface CompetitionRecordForVerification {
  id: string;
  title: string;
  organizer: string;
  startsAt: string | null;
  endsAt: string | null;
}
