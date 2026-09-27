import React from 'react';
import ScreenHeader from '@/components/btau/ScreenHeader';
import PublicFooter from '@/components/btau/PublicFooter';

const EFFECTIVE_DATE = 'September 27, 2026';
const CONTACT_EMAIL = 'hello@backthatappup.app';

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ScreenHeader title="Privacy Policy" />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-6 pt-6 pb-[max(7rem,env(safe-area-inset-bottom))]">
        <p className="text-xs text-muted-foreground">Last updated: {EFFECTIVE_DATE}</p>

        <p className="text-sm leading-relaxed text-muted-foreground">
          This Privacy Policy explains how Back That App Up! ("we", "us", or "the app") collects, uses, and protects your
          information when you use our ambient pre-roll audio capture app. By using the app, you agree to the practices
          described here.
        </p>

        <Section title="1. Audio data">
          <p>
            Back That App Up! keeps a rolling memory-only buffer of ambient sound while armed. <strong>Nothing is written to
            storage until a sound spike or a tap triggers a save.</strong> Saved clips (Moments) are stored on your device by
            default. If you enable optional Google Drive backup, your saved clips are uploaded to a Google Drive folder that
            you own and control.
          </p>
          <p>
            The app does not record phone calls and is not designed to capture conversations without consent. You are
            responsible for complying with all applicable recording and consent laws in your jurisdiction.
          </p>
        </Section>

        <Section title="2. Transcripts">
          <p>
            When you save a Moment, the app may generate a text transcript using server-side speech recognition so you can
            search your library by keyword. The audio is processed for transcription and the resulting text is stored with
            the Moment record associated with your account.
          </p>
        </Section>

        <Section title="3. Account information">
          <p>
            If you create an account, we store your email address and a display name. Authentication is handled by our
            platform provider. We do not collect passwords directly — sign-in is handled through secure, hashed credentials
            or third-party providers (such as Google).
          </p>
        </Section>

        <Section title="4. Usage analytics">
          <p>
            We collect anonymous, aggregate usage analytics (such as app opens, detector arms, and clips saved) to understand
            feature adoption and improve the product. These events are not linked to the content of your audio recordings and
            do not include personally identifiable audio data.
          </p>
        </Section>

        <Section title="5. What we do not collect">
          <ul className="list-disc space-y-1 pl-5">
            <li>We do not sell your audio recordings or transcripts.</li>
            <li>We do not use your recordings to train AI models.</li>
            <li>We do not share your data with advertisers.</li>
            <li>We do not track your location or contacts.</li>
          </ul>
        </Section>

        <Section title="6. Google Drive backup">
          <p>
            Cloud backup is optional and off by default. When enabled, the app connects to your Google Drive using the
            <code className="mx-1 rounded bg-muted px-1 py-0.5 text-xs">drive.file</code>scope, which grants access only to
            files the app itself creates — not your entire Drive. Your clips are uploaded to a folder named "Back That App
            Up!" that you can view, manage, or delete at any time from your Google Drive.
          </p>
        </Section>

        <Section title="7. Data retention">
          <p>
            Temporary (un-saved) captures are held in memory only and are discarded when you close the app. Saved Moments
            remain on your device and in your account until you delete them. Deleted Moments are removed from our database
            and cannot be recovered.
          </p>
        </Section>

        <Section title="8. Your rights and data deletion">
          <p>
            You can delete individual Moments at any time from the Moments screen. To delete all of your data and close your
            account, use <strong>Delete Account</strong> in Settings — this permanently removes all of your saved Moments and
            signs you out. You may also request deletion by contacting us at {CONTACT_EMAIL}.
          </p>
        </Section>

        <Section title="9. Data security">
          <p>
            Audio uploaded for transcription and Drive backup is transmitted over encrypted (HTTPS) connections. Account
            credentials are hashed and managed by our authentication provider. No method of transmission or storage is fully
            secure, but we apply industry-standard safeguards to protect your data.
          </p>
        </Section>

        <Section title="10. Children's privacy">
          <p>
            The app is not directed to children under 13, and we do not knowingly collect data from children. If you believe a
            child has provided us with personal data, contact us and we will delete it.
          </p>
        </Section>

        <Section title="11. Recording consent">
          <p>
            Audio recording may be subject to federal, state, or local consent laws. You are responsible for obtaining any
            required consent before recording others. The app includes a visible status indicator while armed and does not
            operate covertly in jurisdictions that require two-party consent.
          </p>
        </Section>

        <Section title="12. Changes to this policy">
          <p>
            We may update this Privacy Policy from time to time. We will revise the "Last updated" date above when we do.
            Continued use of the app after changes constitutes acceptance of the updated policy.
          </p>
        </Section>

        <Section title="13. Contact us">
          <p>
            Questions about this policy or your data? Email {CONTACT_EMAIL} or visit our Contact page.
          </p>
        </Section>

        <PublicFooter />
      </main>
    </div>
  );
}