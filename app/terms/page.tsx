import type { Metadata } from 'next'
import Link from 'next/link'
import { LegalPage, LegalSection } from '@/components/marketing/legal-content'

export const metadata: Metadata = {
  title: 'Terms of Service — Timeflow',
  description:
    'Read the Terms of Service for Timeflow, the AI calendar assistant. Understand your rights and obligations when using the service.',
}

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      label="Legal"
      lastUpdated="June 2025"
    >
      <LegalSection id="acceptance" title="Acceptance of Terms">
        <p>
          By accessing or using Timeflow (the &ldquo;Service&rdquo;), you agree to be bound by these
          Terms of Service. If you do not agree to these terms, please do not use the Service.
        </p>
        <p>
          Your continued use of the Service after any changes to these terms constitutes your
          acceptance of the revised terms. These terms apply to all visitors, users, and others
          who access or use the Service.
        </p>
      </LegalSection>

      <LegalSection id="description" title="Description of Service">
        <p>
          Timeflow is an AI-powered calendar assistant that connects to your existing calendar
          services (such as Google Calendar) via OAuth 2.0. The Service:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>Reads your calendar data to understand your schedule and availability.</li>
          <li>
            Uses AI to draft suggested schedule changes, such as rescheduling events, blocking
            focus time, or resolving conflicts.
          </li>
          <li>
            Requires your explicit approval before applying any change to your calendar. No
            modification is made without your confirmation.
          </li>
        </ul>
        <p>
          Timeflow acts as an assistant that proposes changes — you remain in full control of
          your calendar at all times.
        </p>
      </LegalSection>

      <LegalSection id="accounts" title="User Accounts and Authentication">
        <p>
          To use the Service, you must create an account. Timeflow supports the following
          authentication methods, powered by Supabase:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            <strong>Magic-link email:</strong> We send a one-time sign-in link to your email
            address. No password is required.
          </li>
          <li>
            <strong>Google OAuth:</strong> You can sign in using your Google account, which also
            grants Timeflow access to your Google Calendar data.
          </li>
        </ul>
        <p>
          You are responsible for maintaining the confidentiality of your account and for all
          activities that occur under your account. You agree to notify us immediately of any
          unauthorised use of your account.
        </p>
      </LegalSection>

      <LegalSection id="acceptable-use" title="Acceptable Use">
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            Violate any applicable local, national, or international law or regulation.
          </li>
          <li>
            Attempt to reverse-engineer, decompile, or extract the underlying AI models,
            algorithms, or source code of the Service.
          </li>
          <li>
            Interfere with, disrupt, or gain unauthorised access to other users&rsquo; accounts
            or data.
          </li>
          <li>
            Transmit any unsolicited or unauthorised advertising, spam, or promotional material.
          </li>
          <li>
            Use the Service in any way that could damage, disable, overburden, or impair the
            Service or its infrastructure.
          </li>
        </ul>
        <p>
          We reserve the right to investigate and take appropriate action against any violations
          of this section, including removing content, suspending or terminating accounts, and
          reporting to law enforcement authorities.
        </p>
      </LegalSection>

      <LegalSection id="ai-suggestions" title="AI-Generated Suggestions">
        <p>
          The AI assistant within Timeflow produces draft schedule suggestions only. These
          suggestions are generated automatically based on your calendar data and stated
          preferences.
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>
            Timeflow does not guarantee the accuracy, completeness, or suitability of any
            AI-generated suggestion.
          </li>
          <li>
            You are solely responsible for reviewing all AI-generated suggestions before
            approving them.
          </li>
          <li>
            No change is applied to your calendar without your explicit approval.
          </li>
          <li>
            Timeflow accepts no liability for decisions you make based on AI-generated
            suggestions, including any consequences arising from approved calendar changes.
          </li>
        </ul>
        <p>
          Always review AI suggestions carefully. If a suggestion does not look right, you can
          reject it and the Service will not apply the change.
        </p>
      </LegalSection>

      <LegalSection id="ip" title="Intellectual Property">
        <p>
          Timeflow and all of its content, features, and functionality — including but not
          limited to the software, design, text, graphics, logos, and AI models — are owned by
          the service operator and are protected by applicable intellectual property laws.
        </p>
        <p>
          You are granted a limited, non-exclusive, non-transferable licence to access and use
          the Service for your personal, non-commercial use. You may not reproduce, distribute,
          modify, create derivative works of, publicly display, or otherwise exploit any part of
          the Service without our prior written consent.
        </p>
        <p>
          Your calendar data and content remain your property. By connecting your calendar, you
          grant Timeflow a limited licence to access and process that data solely to provide the
          Service to you.
        </p>
      </LegalSection>

      <LegalSection id="termination" title="Termination">
        <p>
          We may suspend or terminate your access to the Service at any time, with or without
          notice, for any of the following reasons:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>Violation of these Terms of Service.</li>
          <li>
            Conduct that we believe is harmful to other users, third parties, or the integrity
            of the Service.
          </li>
          <li>
            Extended periods of account inactivity, at our discretion.
          </li>
          <li>
            Requirement to do so by law or a regulatory authority.
          </li>
        </ul>
        <p>
          You may terminate your account at any time by contacting us or using the account
          deletion option in your settings. Upon termination, your right to use the Service
          ceases immediately. Sections of these Terms that by their nature should survive
          termination will remain in effect.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="Limitation of Liability">
        <p>
          The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis
          without warranties of any kind, either express or implied, including but not limited
          to implied warranties of merchantability, fitness for a particular purpose, or
          non-infringement.
        </p>
        <p>
          To the fullest extent permitted by applicable law, Timeflow and its operators shall
          not be liable for any indirect, incidental, special, consequential, or punitive
          damages — including loss of profits, data, goodwill, or other intangible losses —
          arising out of or in connection with your use of, or inability to use, the Service.
        </p>
        <p>
          In no event shall our total liability to you for all claims relating to the Service
          exceed the amount you paid, if any, to use the Service in the twelve months preceding
          the claim.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="Changes to Terms">
        <p>
          We may update these Terms of Service from time to time to reflect changes to the
          Service, applicable law, or our business practices. When we make material changes, we
          will notify you by:
        </p>
        <ul className="list-disc list-outside pl-5 flex flex-col gap-1.5">
          <li>Sending a notification to the email address associated with your account.</li>
          <li>Displaying a prominent notice within the Service.</li>
          <li>Updating the &ldquo;Last updated&rdquo; date at the top of this page.</li>
        </ul>
        <p>
          Your continued use of the Service after the effective date of any revised terms
          constitutes your acceptance of those changes. If you do not agree to the updated
          terms, you must stop using the Service.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="Contact">
        <p>
          If you have any questions, concerns, or requests regarding these Terms of Service,
          please contact the service operator by email. We aim to respond to all enquiries
          within a reasonable timeframe.
        </p>
        <p>
          For privacy-related questions, please refer to our{' '}
          <Link
            href="/privacy"
            className="text-foreground underline underline-offset-2 hover:opacity-80"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <p className="text-[14px] text-muted-foreground border-t border-border pt-10">
        Want to understand how we handle your data? Read our{' '}
        <Link
          href="/privacy"
          className="text-foreground underline underline-offset-2 hover:opacity-80"
        >
          Privacy Policy
        </Link>
        .
      </p>
    </LegalPage>
  )
}
