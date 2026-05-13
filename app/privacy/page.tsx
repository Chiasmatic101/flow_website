export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16 text-white">
      <section className="mx-auto max-w-4xl">
        <a href="/" className="text-sm font-semibold text-cyan-300/80">
          ← Back to Flow
        </a>

        <h1 className="mt-8 text-4xl font-black md:text-6xl">
          Privacy Policy
        </h1>

        <p className="mt-6 text-white/50">Last updated: May 2026</p>

        <div className="mt-10 space-y-8 text-lg leading-8 text-white/60">
          <p>
            Flow is designed to help users improve focus, study routines, sleep,
            and recovery using personalized audio experiences.
          </p>

          <section>
            <h2 className="text-2xl font-black text-white">
              Information we may collect
            </h2>
            <p className="mt-3">
              We may collect account information, app usage data, selected
              sounds, focus session activity, sleep feedback, cognitive game
              results, and basic device or performance information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              How we use information
            </h2>
            <p className="mt-3">
              We use this information to personalize audio, improve study and
              sleep experiences, analyze app performance, and improve the Flow
              service over time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Data sharing
            </h2>
            <p className="mt-3">
              We do not sell personal data. Data may be processed by trusted
              service providers used to operate the app, such as hosting,
              analytics, authentication, or database services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Account and data deletion
            </h2>
            <p className="mt-3">
              Users may request account deletion or deletion of their data by
              contacting the Flow support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Contact
            </h2>
            <p className="mt-3">
              For privacy questions, contact us at: support@flowapp.com
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}