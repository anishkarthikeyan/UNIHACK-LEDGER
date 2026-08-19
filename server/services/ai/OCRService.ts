import { CertificateExtraction } from './models';

// OCR/extraction abstraction. Planned provider: Google Gemini (multimodal — reads the
// image/PDF directly rather than a separate OCR-then-NLP pipeline). Kept as its own interface,
// distinct from AIVerificationService, because "read the certificate" and "judge whether it's
// authentic" are different concerns that Phase 4 (Certificate Module) and Phase 5 (AI
// Verification) may end up calling independently.
export interface OCRService {
  readonly isConfigured: boolean;
  extractCertificateFields(fileBuffer: Buffer, mimeType: string): Promise<CertificateExtraction>;
}
