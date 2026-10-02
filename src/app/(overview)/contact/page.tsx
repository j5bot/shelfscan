'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { ContactForm } from '@/app/ui/ContactForm';
import { NavDrawer } from '@/app/ui/NavDrawer';

const ContactPage = () => {
    useTitle('ShelfScan | Contact');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl gap-4
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">Contact</h1>
                <p className="px-5">
                    Questions, bug reports or feature ideas? Send a message and I&apos;ll get back to you by email.
                </p>
                <ContactForm />
            </div>
        </div>
    </>;
};

export default ContactPage;
