'use client';

import { sendContactMessage } from '@/app/lib/services/contact/server';
import { ContactFields, ContactFormState } from '@/app/lib/types/contact';
import {
    CONTACT_HONEYPOT_FIELD,
    CONTACT_LIMITS,
    ContactMetadataFields,
    contactEventProperties,
    readContactFields,
} from '@/app/lib/utils/contact';
import posthog from 'posthog-js';
import { ReactNode, useActionState, useId } from 'react';

const INITIAL_STATE: ContactFormState = { status: 'idle' };

const UNREACHABLE_STATE: ContactFormState = {
    status: 'error',
    message: 'Sorry, your message could not be sent. Please check your connection and try again.',
};

/** Attach the sender's PostHog identity so it can be included in the email. */
const addPostHogMetadata = (formData: FormData) => {
    try {
        formData.set(ContactMetadataFields.posthogDistinctId, posthog.get_distinct_id() ?? '');
        formData.set(
            ContactMetadataFields.posthogSessionReplayUrl,
            posthog.get_session_replay_url({ withTimestamp: true }) ?? '',
        );
    } catch {
        // PostHog isn't initialised (e.g. no project token): send without metadata
    }
};

const submitContactForm = async (previous: ContactFormState, formData: FormData) => {
    const fields = readContactFields(formData);
    const properties = contactEventProperties(fields);
    addPostHogMetadata(formData);
    posthog.capture('contact_form_submitted', properties);

    const result = await sendContactMessage(previous, formData)
        .catch(() => ({ ...UNREACHABLE_STATE, fields }));

    if (result.status === 'success') {
        posthog.capture('contact_form_sent', properties);
    } else {
        posthog.capture('contact_form_failed', {
            ...properties,
            invalid_fields: Object.keys(result.fieldErrors ?? {}),
        });
    }
    return result;
};

type ContactFieldProps = {
    field: keyof ContactFields;
    label: string;
    state: ContactFormState;
    children: (inputProps: ContactInputProps) => ReactNode;
};

type ContactInputProps = {
    id: string;
    name: keyof ContactFields;
    defaultValue?: string;
    maxLength: number;
    'aria-invalid'?: boolean;
    'aria-describedby'?: string;
};

const ContactField = (props: ContactFieldProps) => {
    const { field, label, state, children } = props;
    const id = useId();
    const errorId = `${id}-error`;
    const error = state.fieldErrors?.[field];

    return <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-semibold">{label}</label>
        {children({
            id,
            name: field,
            defaultValue: state.fields?.[field],
            maxLength: CONTACT_LIMITS[field],
            'aria-invalid': error ? true : undefined,
            'aria-describedby': error ? errorId : undefined,
        })}
        {error && <p id={errorId} className="text-error text-xs">{error}</p>}
    </div>;
};

export const ContactForm = () => {
    const [state, formAction, isPending] = useActionState(submitContactForm, INITIAL_STATE);

    let notice: ReactNode;
    switch (state.status) {
        case 'success':
            notice = <div role="status" className="alert alert-success">{state.message}</div>;
            break;
        case 'error':
            notice = <div role="alert" className="alert alert-error">{state.message}</div>;
            break;
    }

    return <form action={formAction} className="flex flex-col gap-4 px-5" noValidate>
        {notice}
        <ContactField field="name" label="Name" state={state}>
            {inputProps => <input {...inputProps} type="text" autoComplete="name" required
                                  className="input w-full" />}
        </ContactField>
        <ContactField field="email" label="Email" state={state}>
            {inputProps => <input {...inputProps} type="email" autoComplete="email" required
                                  className="input w-full" />}
        </ContactField>
        <ContactField field="subject" label="Subject (optional)" state={state}>
            {inputProps => <input {...inputProps} type="text" className="input w-full" />}
        </ContactField>
        <ContactField field="message" label="Message" state={state}>
            {inputProps => <textarea {...inputProps} required rows={8}
                                     className="textarea w-full" />}
        </ContactField>
        {/* honeypot: hidden from people and assistive tech, often filled in by bots */}
        <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
            <label htmlFor={CONTACT_HONEYPOT_FIELD}>Leave this field empty</label>
            <input id={CONTACT_HONEYPOT_FIELD} name={CONTACT_HONEYPOT_FIELD} type="text"
                   tabIndex={-1} autoComplete="off" />
        </div>
        <button type="submit" className="btn btn-primary self-end" disabled={isPending}>
            {isPending ? 'Sending…' : 'Send Message'}
        </button>
    </form>;
};
