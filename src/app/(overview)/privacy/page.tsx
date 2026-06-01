'use client';

import { useTitle } from '@/app/lib/hooks/useTitle';
import { NavDrawer } from '@/app/ui/NavDrawer';
import Link from 'next/link';

const PrivacyPage = () => {
    useTitle('ShelfScan | Privacy Policy');

    return <>
        <NavDrawer />
        <div className="page-content w-screen pt-15 flex justify-center">
            <div className={`flex flex-col flex-wrap w-10/12 md:w-2/3
                p-4 pb-10 rounded-xl
                bg-base-100 text-sm`}>
                <h1 className="text-3xl text-center text-balance">
                    Privacy Policy
                </h1>

                <p className="text-base-content/60 text-xs text-center mt-1 mb-4">
                    Effective Date: June 1, 2026
                </p>

                <p>
                    ShelfScan (&ldquo;ShelfScan&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) provides a website and browser extension
                    that integrate with BoardGameGeek (&ldquo;BGG&rdquo;) to help users manage and update their
                    BoardGameGeek collections and related information.
                </p>
                <p>
                    This Privacy Policy describes what information is collected, processed, stored, and
                    shared when you use the ShelfScan website and browser extension.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Information We Collect and Process</h2>

                <h3 className="font-semibold mt-3 mb-0.5">Subscription Information</h3>
                <p>
                    ShelfScan uses Extension Pay as its subscription management provider.
                </p>
                <p>
                    When you purchase a subscription, begin a free trial, or verify subscription status,
                    ShelfScan may receive and process information provided by Extension Pay, including:
                </p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Name</li>
                    <li>Email address</li>
                    <li>Subscription status</li>
                    <li>Free trial status</li>
                    <li>Subscription identifiers necessary to verify entitlement</li>
                </ul>
                <p>This information is used to:</p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Verify eligibility for paid features</li>
                    <li>Manage subscriptions and free trials</li>
                    <li>Provide customer support</li>
                    <li>Communicate important account information</li>
                </ul>
                <p>
                    Extension Pay stores subscriber and free trial user email addresses as part of its
                    subscription management services.
                </p>

                <h3 className="font-semibold mt-3 mb-0.5">BoardGameGeek Information</h3>
                <p>
                    The ShelfScan extension communicates with BoardGameGeek on behalf of the user.
                </p>
                <p>
                    The extension may access information available through the user&apos;s authenticated BGG
                    session, including:
                </p>
                <ul className="list-disc pl-5 pb-2">
                    <li>BoardGameGeek username</li>
                    <li>BoardGameGeek account email address</li>
                    <li>BoardGameGeek supporter status</li>
                    <li>Collection and account information necessary to perform user-requested actions</li>
                </ul>
                <p>This information is used solely to:</p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Verify BGG supporter status when required</li>
                    <li>Correlate a ShelfScan subscriber account with a BGG account</li>
                    <li>Read information from BGG on the user&apos;s behalf</li>
                    <li>Submit updates to BGG on the user&apos;s behalf</li>
                    <li>Provide extension functionality requested by the user</li>
                </ul>
                <p>
                    ShelfScan does not permanently store personally identifiable information obtained from BGG.
                </p>

                <h3 className="font-semibold mt-3 mb-0.5">Authentication Tokens</h3>
                <p>
                    The extension may temporarily store authorization tokens required to communicate with
                    BoardGameGeek and perform actions requested by the user.
                </p>
                <p>These tokens:</p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Are stored only as required for operation of the extension</li>
                    <li>Are not analyzed, sold, or shared</li>
                    <li>Are not used for advertising or profiling purposes</li>
                </ul>
                <p>ShelfScan does not collect or store BoardGameGeek usernames and passwords.</p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Information We Do Not Collect</h2>
                <p>ShelfScan does not collect or permanently store:</p>
                <ul className="list-disc pl-5 pb-2">
                    <li>BoardGameGeek passwords</li>
                    <li>BoardGameGeek login credentials</li>
                    <li>Payment card numbers</li>
                    <li>Payment card security codes</li>
                    <li>Personally identifiable information from BoardGameGeek beyond what is temporarily required to provide the service</li>
                </ul>

                <h2 className="text-lg font-semibold mt-5 mb-1">Payments</h2>
                <p>
                    Payments are processed through Stripe via Extension Pay.
                </p>
                <p>
                    Payment information, including payment card details, is collected and stored by Stripe
                    and related payment processors as necessary to complete transactions authorized by the
                    user.
                </p>
                <p>ShelfScan does not receive or store full payment card information.</p>

                <h2 className="text-lg font-semibold mt-5 mb-1">How We Use Information</h2>
                <p>
                    Information is used only for purposes related to operating and improving ShelfScan,
                    including:
                </p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Verifying subscription eligibility</li>
                    <li>Verifying BGG supporter status</li>
                    <li>Matching ShelfScan subscriber accounts with BGG accounts</li>
                    <li>Reading data from BGG on behalf of users</li>
                    <li>Making updates to BGG on behalf of users</li>
                    <li>Providing customer support</li>
                    <li>Maintaining service functionality and security</li>
                    <li>Communicating with subscribers and trial users</li>
                </ul>

                <h2 className="text-lg font-semibold mt-5 mb-1">Communications</h2>
                <p>
                    All users of ShelfScan are considered participants in an ongoing testing and evaluation
                    program.
                </p>
                <p>Subscribers and free trial users may occasionally receive communications related to:</p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Product updates</li>
                    <li>Service announcements</li>
                    <li>Requests for optional feedback</li>
                    <li>Surveys regarding product functionality</li>
                    <li>Promotional offers, including discounted subscription opportunities</li>
                </ul>
                <p>
                    Users may opt out of promotional communications where required by applicable law.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Browser Extension Permissions</h2>
                <p>
                    The ShelfScan extension requires certain permissions to function properly.
                </p>

                <h3 className="font-semibold mt-3 mb-0.5">BoardGameGeek Permissions</h3>
                <p>
                    Permission to read and modify data on BoardGameGeek pages is required in order to:
                </p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Access information requested by the user</li>
                    <li>Update information on the user&apos;s behalf</li>
                    <li>Synchronize data between ShelfScan and BoardGameGeek</li>
                </ul>

                <h3 className="font-semibold mt-3 mb-0.5">ShelfScan Permissions</h3>
                <p>
                    Permission to read and modify data on ShelfScan pages is required in order to:
                </p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Display ShelfScan functionality</li>
                    <li>Initiate communication with BoardGameGeek</li>
                    <li>Receive responses from BoardGameGeek</li>
                    <li>Provide extension features</li>
                </ul>

                <h3 className="font-semibold mt-3 mb-0.5">Extension Pay Permissions</h3>
                <p>
                    Permission to access Extension Pay resources is required in order to:
                </p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Initiate subscriptions</li>
                    <li>Verify subscription status</li>
                    <li>Manage free trial eligibility</li>
                    <li>Enable or disable paid features</li>
                </ul>

                <h2 className="text-lg font-semibold mt-5 mb-1">Information Sharing</h2>
                <p>ShelfScan does not sell personal information.</p>
                <p>
                    Information may be shared only as necessary with service providers that support
                    operation of the service, including:
                </p>
                <ul className="list-disc pl-5 pb-2">
                    <li>Extension Pay for subscription management</li>
                    <li>Stripe and related payment processors for payment processing</li>
                    <li>BoardGameGeek for user-requested interactions with BGG accounts</li>
                </ul>
                <p>
                    These providers process information according to their own privacy policies and
                    contractual obligations.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Data Retention</h2>
                <p>
                    ShelfScan retains only the information reasonably necessary to operate the service.
                </p>
                <p>
                    Subscriber and free trial information may be retained for account administration,
                    support, legal compliance, and business recordkeeping purposes.
                </p>
                <p>
                    Information obtained from BoardGameGeek is generally processed transiently and is not
                    permanently stored by ShelfScan except where necessary to provide requested
                    functionality.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Security</h2>
                <p>
                    ShelfScan uses commercially reasonable administrative, technical, and organizational
                    measures to protect information from unauthorized access, disclosure, alteration, or
                    destruction.
                </p>
                <p>
                    No method of electronic transmission or storage can be guaranteed to be completely
                    secure.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Third-Party Services</h2>
                <p>ShelfScan relies on third-party services, including:</p>
                <ul className="list-disc pl-5 pb-2">
                    <li>BoardGameGeek</li>
                    <li>Extension Pay</li>
                    <li>Stripe</li>
                </ul>
                <p>
                    Your use of those services is also governed by their respective privacy policies and
                    terms of service.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Children&apos;s Privacy</h2>
                <p>
                    ShelfScan is not directed to children under the age of 13 and does not knowingly
                    collect personal information from children.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Changes to This Privacy Policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. Any changes will be posted on the
                    ShelfScan website. Continued use of ShelfScan after changes become effective
                    constitutes acceptance of the updated Privacy Policy.
                </p>

                <h2 className="text-lg font-semibold mt-5 mb-1">Contact Information</h2>
                <p>If you have questions regarding this Privacy Policy, please contact:</p>
                <p>
                    ShelfScan<br />
                    Website: <Link href="https://www.shelfscan.io" className="underline">https://www.shelfscan.io</Link><br />
                    Email: <Link href="mailto:support@shelfscan.io" className="underline">support@shelfscan.io</Link>
                </p>
            </div>
        </div>
    </>;
};

export default PrivacyPage;
