import { EmailMessage } from '../EmailService';
import { button, emailLayout } from './shared';

// Every template is a pure function: (data) -> EmailMessage. No template touches EmailService or
// the database — route handlers (Phase 7 wires the actual call sites) build the data, call the
// template, and hand the result to EmailService.send(). Kept as plain functions rather than a
// templating engine because five short, mostly-static emails don't need one.

export function registrationEmail(to: string, params: { studentName: string; hackathonTitle: string; appUrl: string }): EmailMessage {
  return {
    to,
    subject: `You're registered for ${params.hackathonTitle}`,
    html: emailLayout('Registration received', `
      <p>Hi ${params.studentName},</p>
      <p>We've received your registration for <strong>${params.hackathonTitle}</strong>. Faculty will review it shortly — you'll get another email once it's approved.</p>
      ${button('View pipeline', `${params.appUrl}/pipeline`)}
    `),
  };
}

export function approvalEmail(to: string, params: { recipientName: string; subjectTitle: string; outcome: 'approved' | 'rejected' | 'changes_requested'; note?: string; appUrl: string }): EmailMessage {
  const outcomeLabel = { approved: 'approved', rejected: 'rejected', changes_requested: 'sent back for changes' }[params.outcome];
  return {
    to,
    subject: `${params.subjectTitle}: ${outcomeLabel}`,
    html: emailLayout(`Your submission was ${outcomeLabel}`, `
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.subjectTitle}</strong> has been ${outcomeLabel} by faculty.</p>
      ${params.note ? `<p style="background:#1a1a1a;border-left:3px solid #facc15;padding:12px 16px;border-radius:4px;">${params.note}</p>` : ''}
      ${button('View details', params.appUrl)}
    `),
  };
}

export function reminderEmail(to: string, params: { recipientName: string; reminderTitle: string; whenText: string; appUrl: string }): EmailMessage {
  return {
    to,
    subject: `Reminder: ${params.reminderTitle}`,
    html: emailLayout('Upcoming reminder', `
      <p>Hi ${params.recipientName},</p>
      <p><strong>${params.reminderTitle}</strong> — ${params.whenText}.</p>
      ${button('Open calendar', `${params.appUrl}/calendar`)}
    `),
  };
}

export function passwordResetEmail(to: string, params: { recipientName: string; resetUrl: string; expiresInMinutes: number }): EmailMessage {
  return {
    to,
    subject: 'Reset your UniHack Ledger password',
    html: emailLayout('Password reset requested', `
      <p>Hi ${params.recipientName},</p>
      <p>Click below to set a new password. This link expires in ${params.expiresInMinutes} minutes and can only be used once.</p>
      ${button('Reset password', params.resetUrl)}
      <p style="color:#737373;font-size:12px;margin-top:20px;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
    `),
  };
}

export function verificationEmail(to: string, params: { recipientName: string; verifyUrl: string }): EmailMessage {
  return {
    to,
    subject: 'Verify your UniHack Ledger account',
    html: emailLayout('Confirm your email', `
      <p>Hi ${params.recipientName},</p>
      <p>Confirm this is your email address to finish setting up your account.</p>
      ${button('Verify email', params.verifyUrl)}
    `),
  };
}
