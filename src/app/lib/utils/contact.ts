import { ContactFieldErrors, ContactFields, ContactMetadata } from '@/app/lib/types/contact';
import { z } from 'zod';

export const CONTACT_LIMITS = {
    name: 100,
    email: 254,
    subject: 150,
    message: 5000,
} as const;

/** Name of the hidden field bots tend to fill in; real users never see it. */
export const CONTACT_HONEYPOT_FIELD = 'website';

/** Form fields the client fills in from PostHog before submitting. */
export const ContactMetadataFields = {
    posthogDistinctId: 'posthog_distinct_id',
    posthogSessionReplayUrl: 'posthog_session_replay_url',
} as const;

const METADATA_MAX_LENGTH = 500;

const ContactSchema = z.object({
    name: z.string().trim()
        .min(1, 'Please enter your name.')
        .max(CONTACT_LIMITS.name, `Name must be ${CONTACT_LIMITS.name} characters or fewer.`),
    email: z.string().trim()
        .max(CONTACT_LIMITS.email, 'Email address is too long.')
        .pipe(z.email('Please enter a valid email address.')),
    subject: z.string().trim()
        .max(CONTACT_LIMITS.subject, `Subject must be ${CONTACT_LIMITS.subject} characters or fewer.`),
    message: z.string().trim()
        .min(10, 'Please enter a message of at least 10 characters.')
        .max(CONTACT_LIMITS.message, `Message must be ${CONTACT_LIMITS.message} characters or fewer.`),
});

export type ContactValidationResult =
    | { ok: true; data: ContactFields }
    | { ok: false; fieldErrors: ContactFieldErrors };

const readField = (formData: FormData, key: string) => {
    const value = formData.get(key);
    return typeof value === 'string' ? value : '';
};

export const readContactFields = (formData: FormData): ContactFields => ({
    name: readField(formData, 'name'),
    email: readField(formData, 'email'),
    subject: readField(formData, 'subject'),
    message: readField(formData, 'message'),
});

/** Client-supplied, so it is untrusted: keep it short, single-line and drop anything malformed. */
const sanitizeMetadataValue = (value: string) => {
    const cleaned = value.replace(/[\r\n]+/g, ' ').trim();
    return cleaned && cleaned.length <= METADATA_MAX_LENGTH ? cleaned : undefined;
};

const sanitizeUrl = (value: string) => {
    const cleaned = sanitizeMetadataValue(value);
    if (!cleaned) {
        return undefined;
    }
    try {
        return new URL(cleaned).protocol === 'https:' ? cleaned : undefined;
    } catch {
        return undefined;
    }
};

export const readContactMetadata = (formData: FormData): ContactMetadata => ({
    posthogDistinctId: sanitizeMetadataValue(readField(formData, ContactMetadataFields.posthogDistinctId)),
    posthogSessionReplayUrl: sanitizeUrl(readField(formData, ContactMetadataFields.posthogSessionReplayUrl)),
});

export const isHoneypotFilled = (formData: FormData) => {
    const value = formData.get(CONTACT_HONEYPOT_FIELD);
    return typeof value === 'string' && value.trim().length > 0;
};

export const validateContactFields = (fields: ContactFields): ContactValidationResult => {
    const result = ContactSchema.safeParse(fields);
    if (result.success) {
        return { ok: true, data: result.data };
    }
    const fieldErrors: ContactFieldErrors = {};
    for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ContactFields;
        if (!fieldErrors[key]) {
            fieldErrors[key] = issue.message;
        }
    }
    return { ok: false, fieldErrors };
};

/** Collapse line breaks so user input can't add lines to the email subject. */
const singleLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

export const buildContactSubject = (fields: ContactFields) =>
    `[ShelfScan Contact] ${singleLine(fields.subject || 'New message')} — ${singleLine(fields.name)}`;

export const buildContactText = (fields: ContactFields, metadata: ContactMetadata = {}) => [
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
    `Subject: ${fields.subject || '(none)'}`,
    '',
    fields.message,
    '',
    '---',
    `PostHog distinct ID: ${metadata.posthogDistinctId ?? '(unavailable)'}`,
    `PostHog session replay: ${metadata.posthogSessionReplayUrl ?? '(unavailable)'}`,
].join('\n');

/** Event properties describing a submission without sending its content to analytics. */
export const contactEventProperties = (fields: ContactFields) => ({
    has_subject: fields.subject.trim().length > 0,
    message_length: fields.message.trim().length,
});
