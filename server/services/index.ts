import { pool } from '../db/pool';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { LocalStorageService } from './storage/LocalStorageService';
import { StorageService } from './storage/StorageService';
import { InAppNotificationService } from './notifications/InAppNotificationService';
import { NotificationService } from './notifications/NotificationService';
import { FcmPushNotificationService, NoopPushNotificationService, PushNotificationService } from './notifications/PushNotificationService';
import { NoopEmailService, ResendEmailService } from './email/EmailQueue';
import { EmailService } from './email/EmailService';
import { GeminiOCRService, NoopOCRService } from './ai/GeminiOCRService';
import { OCRService } from './ai/OCRService';
import { GeminiVerificationService, NoopAIVerificationService } from './ai/GeminiVerificationService';
import { AIVerificationService } from './ai/AIVerificationService';

// Single composition root for every external-service abstraction. This is the ONE place that
// decides which concrete implementation backs each interface, based on which credentials are
// actually configured — every route/service that needs one of these imports `services` from
// here and depends only on the interface type, never a concrete class. Swapping local storage
// for S3, or adding a second email provider, means changing this file alone.
export interface Services {
  storage: StorageService;
  notifications: NotificationService;
  push: PushNotificationService;
  email: EmailService;
  ocr: OCRService;
  aiVerification: AIVerificationService;
}

function buildServices(): Services {
  const push: PushNotificationService = config.firebase.isConfigured
    ? new FcmPushNotificationService(config.firebase.projectId!, config.firebase.serviceAccountJson!)
    : new NoopPushNotificationService();

  const email: EmailService = config.resend.isConfigured
    ? new ResendEmailService(config.resend.apiKey!, config.resend.from)
    : new NoopEmailService();

  const ocr: OCRService = config.gemini.isConfigured
    ? new GeminiOCRService(config.gemini.apiKey!)
    : new NoopOCRService();

  const aiVerification: AIVerificationService = config.gemini.isConfigured
    ? new GeminiVerificationService(config.gemini.apiKey!)
    : new NoopAIVerificationService();

  const storage: StorageService = new LocalStorageService();
  const notifications: NotificationService = new InAppNotificationService(pool, push);

  for (const [name, svc] of Object.entries({ push, email, ocr, aiVerification }) as [string, { isConfigured: boolean }][]) {
    if (!svc.isConfigured) logger.warn(`${name} service running in no-op mode — pending external credentials (see README "External setup checklist").`);
  }

  return { storage, notifications, push, email, ocr, aiVerification };
}

export const services: Services = buildServices();
