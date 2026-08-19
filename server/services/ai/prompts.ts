import { CompetitionRecordForVerification } from './models';

// Prompt templates live here, separate from the service classes that call them, so the wording
// can be iterated on without touching request/parsing/retry logic.

export const CERTIFICATE_EXTRACTION_PROMPT = `You are an OCR and information-extraction assistant for a university hackathon-tracking system. You will be shown an image or PDF of a certificate.

Extract exactly this JSON shape and nothing else:
{
  "studentName": string | null,
  "competitionName": string | null,
  "date": string | null,   // ISO 8601 date (YYYY-MM-DD) if determinable, else the raw date text, else null
  "organizer": string | null,
  "certificateNumber": string | null,
  "rawText": string        // the complete text you can read on the certificate, verbatim
}

Rules:
- Use null for any field you cannot confidently read — never guess or fabricate a value.
- "competitionName" is the name of the hackathon/competition/event, not the certificate title (e.g. not "Certificate of Participation").
- Return ONLY the JSON object, no commentary, no markdown fences.`;

export function certificateAuthenticityPrompt(extraction: { studentName: string | null; competitionName: string | null; date: string | null; organizer: string | null }, candidates: CompetitionRecordForVerification[]): string {
  return `You are assisting a faculty reviewer in deciding whether a submitted certificate is authentic. You do NOT make the final decision — you produce a score and reasoning for a human to review.

Extracted certificate data:
${JSON.stringify(extraction, null, 2)}

Candidate competitions on record that might match (from this institution's database):
${JSON.stringify(candidates, null, 2)}

Return exactly this JSON shape and nothing else:
{
  "score": number,               // 0-100 authenticity confidence
  "matchedHackathonId": string | null,  // id of the best-matching candidate above, or null if none match
  "reasons": string[],           // short factual reasons supporting the score (e.g. "organizer name matches exactly")
  "flags": string[]              // concerns worth a human's attention (e.g. "no competition on record with this name", "date is after the registration deadline")
}

Be conservative: a missing field, an unmatched competition name, or an implausible date should lower the score and add a flag rather than being ignored. Return ONLY the JSON object.`;
}
