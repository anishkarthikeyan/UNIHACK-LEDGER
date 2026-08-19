import { AuthenticityResult, CertificateExtraction, CompetitionRecordForVerification } from './models';

// AI-assisted certificate verification. Read this contract carefully before wiring it into a
// route (Phase 5): this service produces a SCORE AND REASONING, never a final approve/reject
// decision. The certificate review endpoint must always require an explicit faculty action —
// this service's output is input to that human decision, not a replacement for it. That
// constraint is enforced at the call site (Phase 5), not here, but the interface is named and
// shaped to make the "assist, don't decide" boundary obvious to whoever wires it in.
export interface AIVerificationService {
  readonly isConfigured: boolean;
  scoreAuthenticity(extraction: CertificateExtraction, candidates: CompetitionRecordForVerification[]): Promise<AuthenticityResult>;
}
