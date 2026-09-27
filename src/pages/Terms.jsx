import React from 'react';
import ScreenHeader from '@/components/btau/ScreenHeader';
import PublicFooter from '@/components/btau/PublicFooter';

const EFFECTIVE_DATE = 'September 27, 2026';
const COMPANY = 'Omega UI, LLC';
const COMPANY_LOCATION = 'Edison';
const CONTACT_EMAIL = 'contact@syncloudconnect.com';
const SUPPORT_EMAIL = 'support@syncloudconnect.com';
const PHONE_DISPLAY = '+1 941-882-0130';
const PHONE_TEL = '+19418820130';

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader title="Terms of Service" />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-6 pb-[max(7rem,env(safe-area-inset-bottom))]">
        <p className="text-xs text-muted-foreground">Last updated: {EFFECTIVE_DATE}</p>

        <p className="text-sm leading-relaxed text-muted-foreground">
          These Terms of Service ("Terms") govern your use of Back That App Up! ("the app", "we", or "us"). By creating an
          account or using the app, you agree to these Terms. If you do not agree, do not use the app.
        </p>

        <Section title="1. Your account">
          <p>
            You must provide accurate information when creating an account and keep your credentials secure. You are
            responsible for all activity that occurs under your account. The app is intended for users 13 years and older.
          </p>
        </Section>

        <Section title="2. Acceptable use">
          <ul className="list-disc space-y-1 pl-5">
            <li>Use the app only for lawful purposes.</li>
            <li>Obtain any consent required by law before recording others.</li>
            <li>Do not use the app to record without consent in jurisdictions that require it.</li>
            <li>Do not attempt to reverse-engineer, overload, or disrupt the app or its servers.</li>
            <li>Do not use the app to harass, surveil, or harm another person.</li>
          </ul>
        </Section>

        <Section title="3. Recording and legal compliance">
          <p>
            Back That App Up! is an ambient audio tool. You are solely responsible for ensuring your use complies with all
            applicable recording, privacy, and wiretap laws. We are not liable for your unauthorized or unlawful recording of
            others. The app displays a status indicator while armed and does not function as a covert or hidden recording
            device.
          </p>
        </Section>

        <Section title="4. Subscriptions and billing">
          <p>
            Some features (such as AI transcription and Google Drive backup) require a paid subscription. Subscription fees
            are billed through the platform's payment provider on a recurring basis until you cancel. You can cancel at any
            time; cancellation stops future billing but does not refund the current period. Prices may change with notice.
          </p>
        </Section>

        <Section title="5. Your content">
          <p>
            You retain ownership of the audio recordings and transcripts you create ("your content"). You grant us a limited
            license to process your content solely to provide the app's features (transcription, storage, and backup). We do
            not claim ownership of your content, and we will not use it for any purpose other than providing the service to
            you.
          </p>
        </Section>

        <Section title="6. Data deletion and account closure">
          <p>
            You can delete individual Moments at any time. Use Delete Account in Settings to remove all of your saved data
            and close your account, or contact us at {CONTACT_EMAIL} to request deletion.
          </p>
        </Section>

        <Section title="7. Disclaimers">
          <p>
            The app is provided "as is" without warranties of any kind. We do not guarantee that the app will be
            uninterrupted, error-free, or that any moment will be successfully captured. Audio capture depends on device
            capabilities, permissions, and battery state, and may fail without notice.
          </p>
        </Section>

        <Section title="8. Limitation of liability">
          <p>
            To the maximum extent permitted by law, we are not liable for any indirect, incidental, or consequential damages
            arising from your use of the app, including any missed recordings or lost moments. Our total liability is
            limited to the amount you paid us in the preceding 12 months.
          </p>
        </Section>

        <Section title="9. Termination">
          <p>
            You may stop using the app and delete your account at any time. We may suspend or terminate your access if you
            violate these Terms or if we discontinue the app. Upon termination, your saved data will be deleted.
          </p>
        </Section>

        <Section title="10. Changes to these Terms">
          <p>
            We may update these Terms from time to time. We will revise the "Last updated" date above when we do. Continued
            use of the app after changes constitutes acceptance of the updated Terms.
          </p>
        </Section>

        <Section title="11. Contact">
          <p className="font-medium text-foreground">{COMPANY} · {COMPANY_LOCATION}</p>
          <p>
            General questions: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:opacity-80">{CONTACT_EMAIL}</a>
          </p>
          <p>
            Support: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:opacity-80">{SUPPORT_EMAIL}</a> · <a href={`tel:${PHONE_TEL}`} className="text-primary hover:opacity-80">{PHONE_DISPLAY}</a>
          </p>
        </Section>

        <PublicFooter />
      </main>
    </div>
  );
}