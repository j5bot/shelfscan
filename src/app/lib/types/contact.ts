export type ContactFields = {
    name: string;
    email: string;
    subject: string;
    message: string;
};

export type ContactFieldErrors = Partial<Record<keyof ContactFields, string>>;

export type ContactFormState = {
    status: 'idle' | 'success' | 'error';
    message?: string;
    fieldErrors?: ContactFieldErrors;
    fields?: Partial<ContactFields>;
};
