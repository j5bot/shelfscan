'use server';

import { ContactFormState } from '@/app/lib/types/contact';
import {
    buildContactSubject,
    buildContactText,
    isHoneypotFilled,
    readContactFields,
    readContactMetadata,
    validateContactFields,
} from '@/app/lib/utils/contact';
import { Resend } from 'resend';

const GENERIC_ERROR = 'Sorry, your message could not be sent. Please try again later.';

export const sendContactMessage = async (
    _previous: ContactFormState,
    formData: FormData,
): Promise<ContactFormState> => {
    const fields = readContactFields(formData);

    // pretend a bot submission succeeded so it doesn't retry
    if (isHoneypotFilled(formData)) {
        return { status: 'success', message: 'Thanks! Your message has been sent.' };
    }

    const validation = validateContactFields(fields);
    if (!validation.ok) {
        return {
            status: 'error',
            message: 'Please fix the highlighted fields.',
            fieldErrors: validation.fieldErrors,
            fields,
        };
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.CONTACT_FROM_EMAIL;
    const to = process.env.CONTACT_TO_EMAIL;
    if (!apiKey || !from || !to) {
        console.error('contact form is missing RESEND_API_KEY, CONTACT_FROM_EMAIL or CONTACT_TO_EMAIL');
        return { status: 'error', message: GENERIC_ERROR, fields };
    }

    const { data } = validation;
    try {
        const resend = new Resend(apiKey);
        const { error } = await resend.emails.send({
            from,
            to: to.split(',').map(address => address.trim()),
            replyTo: data.email,
            subject: buildContactSubject(data),
            text: buildContactText(data, readContactMetadata(formData)),
        });
        if (error) {
            console.error('resend rejected contact message', error);
            return { status: 'error', message: GENERIC_ERROR, fields };
        }
    } catch (error) {
        console.error('failed to send contact message', error);
        return { status: 'error', message: GENERIC_ERROR, fields };
    }

    return { status: 'success', message: 'Thanks! Your message has been sent.' };
};
