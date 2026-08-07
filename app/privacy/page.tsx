import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/marketing/legal-content'

export const metadata: Metadata = {
  title: 'Privacy Policy — Timeflow',
  description:
    'Read the Privacy Policy for Timeflow, the AI calendar assistant. Understand what data we collect, how it is used, and your rights.',
}

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      label="Legal"
      lastUpdated="June 2025"
    >
      <LegalSection id="info-collect" title="Information We Collect">
        <p>
          When you use Timeflow, we collect the following categories of information:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Email address</strong> — collected during account creation via magic-link
            email or Google OAuth authentication.
          </li>
          <li>
            <strong>OAuth access tokens</strong> — tokens issued by third-party calendar
            providers (such as Google) when you connect a calendar service to Timeflow.
          </li>
          <li>
            <strong>Calendar event data</strong> — event titles, times, attendees, and other
            metadata accessed from your connected calendar during an active session to power
            AI suggestions.
          </li>
          <li>
            <strong>Usage and interaction data</strong> — information about how you interact
            with the Service, such as features used, suggestions accepted or rejected, and
            session activity, used to improve the Service.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="how-we-use" title="How We Use Your Information">
        <p>We use the information we collect for the following purposes:</p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Provide the AI calendar assistant service</strong> — to analyse your
            schedule and generate intelligent suggestions tailored to your calendar.
          </li>
          <li>
            <strong>Authenticate you</strong> — to verify your identity, maintain your
            session, and secure your account.
          </li>
          <li>
            <strong>Generate schedule suggestions</strong> — to process your calendar event
            data through our AI models and produce draft changes for your review and approval.
          </li>
        </ul>
        <p>
          We do not use your data for advertising, profiling for third-party marketing, or any
          purpose beyond providing and improving the Service.
        </p>
      </LegalSection>

      <LegalSection id="calendar-oauth" title="Calendar Data and OAuth Connections">
        <p>
          When you connect a calendar service such as Google Calendar, Timeflow receives an
          OAuth 2.0 access token from that provider. This token is stored securely by Supabase
          and is used solely to read your calendar data on your behalf.
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            Calendar event data is read only to generate AI-powered schedule suggestions.
          </li>
          <li>
            The AI assistant will <strong>not</strong> modify, create, or delete any calendar
            event without your explicit approval. Every proposed change is presented to you as
            a draft that you must confirm before it is applied.
          </li>
          <li>
            You can revoke Timeflow&rsquo;s access to your calendar at any time by disconnecting
            the OAuth connection in your account settings or through your calendar provider&rsquo;s
            security settings.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="demo-mode" title="Demo Mode">
        <p>
          Timeflow offers a publicly accessible Demo Mode (at <code>/home</code>) that allows
          anyone to explore the calendar assistant experience without creating an account.
        </p>
        <p>
          In Demo Mode, no personal data is collected, stored, or transmitted to external
          servers. All data displayed in Demo Mode is pre-seeded, illustrative content that
          exists only within your browser session. When you close or leave the Demo Mode
          session, no data is retained.
        </p>
      </LegalSection>

      <LegalSection id="data-sharing" title="Data Sharing">
        <p>
          Timeflow does not sell, rent, or trade your personal data to third parties for their
          own commercial purposes.
        </p>
        <p>
          We work with a small number of trusted third-party service providers who process data
          on our behalf in order to operate the Service:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Supabase</strong> — provides authentication, database storage, and Row
            Level Security. Your account data and OAuth tokens are stored within Supabase.
          </li>
          <li>
            <strong>Google OAuth</strong> — used for sign-in and calendar access. When you
            authenticate via Google, Google&rsquo;s own privacy policy also applies to that
            interaction.
          </li>
          <li>
            <strong>Vercel</strong> — hosts and serves the Timeflow web application. Vercel
            may process request logs and edge network data as part of standard hosting
            operations.
          </li>
        </ul>
        <p>
          Each of these providers is contractually obligated to handle your data securely and
          only as required to provide their services to us.
        </p>
      </LegalSection>

      <LegalSection id="data-retention" title="Data Retention">
        <p>
          We retain your personal data for as long as your account is active or as needed to
          provide the Service. Specifically:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Account data</strong> (email address, authentication records) is retained
            for the lifetime of your account.
          </li>
          <li>
            <strong>OAuth tokens</strong> are retained until you disconnect the calendar
            connection or delete your account, at which point they are removed from our systems.
          </li>
          <li>
            <strong>Calendar event data</strong> is accessed in-session and is not persistently
            stored beyond what is necessary to generate a suggestion during that session.
          </li>
        </ul>
        <p>
          To request deletion of your account and associated data, please contact us by email.
          We will process deletion requests within a reasonable timeframe and confirm when your
          data has been removed.
        </p>
      </LegalSection>

      <LegalSection id="your-rights" title="Your Rights">
        <p>
          Depending on your location, you may have the following rights with respect to your
          personal data:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Access</strong> — request a copy of the personal data we hold about you.
          </li>
          <li>
            <strong>Correction</strong> — request that we correct inaccurate or incomplete
            personal data.
          </li>
          <li>
            <strong>Deletion</strong> — request that we delete your personal data, subject to
            any legal obligations requiring retention.
          </li>
          <li>
            <strong>Revocation of OAuth consent</strong> — disconnect any OAuth calendar
            connection at any time via your account settings, which will revoke Timeflow&rsquo;s
            access to your calendar data.
          </li>
        </ul>
        <p>
          To exercise any of these rights, please contact us by email. We will respond to your
          request within a reasonable timeframe.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="Cookies and Tracking">
        <p>
          Timeflow uses a minimal set of cookies and session tokens necessary to operate the
          Service:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Authentication session cookies</strong> — set by Supabase to maintain your
            signed-in session across page loads. These are strictly necessary for the Service
            to function and are removed when you sign out.
          </li>
          <li>
            <strong>OAuth state tokens</strong> — short-lived tokens used during the OAuth
            sign-in flow to prevent cross-site request forgery (CSRF). These are discarded
            after the authentication flow completes.
          </li>
        </ul>
        <p>
          We do not use advertising cookies, third-party tracking pixels, or persistent
          analytics cookies. Usage and interaction data may be collected in aggregate for
          product improvement purposes, without identifying you individually.
        </p>
      </LegalSection>

      <LegalSection id="security" title="Security">
        <p>
          We take the security of your data seriously and have implemented technical and
          organisational measures to protect it:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Supabase Row Level Security (RLS)</strong> — all database tables are
            protected by RLS policies, ensuring that each user can only access their own data.
            No user can read or modify another user&rsquo;s records.
          </li>
          <li>
            <strong>Encrypted OAuth token storage</strong> — OAuth access tokens for connected
            calendar services are stored with encryption at rest within Supabase, reducing the
            risk of token exposure in the event of a data breach.
          </li>
          <li>
            <strong>HTTPS in transit</strong> — all data transmitted between your browser and
            Timeflow&rsquo;s servers is encrypted using TLS.
          </li>
        </ul>
        <p>
          While we strive to protect your data, no method of transmission or storage is 100%
          secure. If you believe your account has been compromised, please contact us
          immediately.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time to reflect changes to the
          Service, applicable law, or our data practices. When we make material changes, we
          will notify you by:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>Sending a notification to the email address associated with your account.</li>
          <li>Displaying a prominent notice within the Service.</li>
          <li>Updating the &ldquo;Last updated&rdquo; date at the top of this page.</li>
        </ul>
        <p>
          We encourage you to review this Policy periodically to stay informed about how we
          protect your information. Your continued use of the Service after the effective date
          of any revised Policy constitutes your acceptance of the changes.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or
          the way we handle your personal data, please contact the service operator by email.
          We aim to respond to all privacy-related enquiries within a reasonable timeframe.
        </p>
        <p>
          For information about the conditions of using the Service, please refer to our{' '}
          <Link
            href="/terms"
            className="text-foreground underline underline-offset-2 hover:opacity-80"
          >
            Terms of Service
          </Link>
          .
        </p>
      </LegalSection>

      <p className="text-[14px] text-muted-foreground border-t border-border pt-10">
        Want to understand the conditions for using this Service? Read our{' '}
        <Link
          href="/terms"
          className="text-foreground underline underline-offset-2 hover:opacity-80"
        >
          Terms of Service
        </Link>
        .
      </p>
    </LegalPage>
  )
}
