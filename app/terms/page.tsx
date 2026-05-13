export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-16 text-white">
      <section className="mx-auto max-w-4xl">
        <a href="/" className="text-sm font-semibold text-cyan-300/80">
          ← Back to Flow
        </a>

        <h1 className="mt-8 text-4xl font-black md:text-6xl">
          Terms & Conditions
        </h1>

        <p className="mt-6 text-white/50">Last updated: May 2026</p>

        <div className="mt-10 space-y-8 text-lg leading-8 text-white/60">
          <p>
            These Terms & Conditions govern your use of Flow, an audio-based
            focus, study, sleep, and recovery app.
          </p>

          <section>
            <h2 className="text-2xl font-black text-white">
              Use of Flow
            </h2>
            <p className="mt-3">
              Flow is intended for general wellbeing, productivity, study, and
              sleep support. You agree to use the app responsibly and only for
              lawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Not medical advice
            </h2>
            <p className="mt-3">
              Flow is not a medical device and does not provide medical advice,
              diagnosis, or treatment. If you have concerns about sleep, health,
              or mental wellbeing, consult a qualified professional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Results may vary
            </h2>
            <p className="mt-3">
              Flow uses personalized audio experiences, but individual outcomes
              may vary. We do not guarantee specific improvements in sleep,
              focus, cognition, or academic performance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Changes to the service
            </h2>
            <p className="mt-3">
              We may update, modify, or discontinue features of Flow over time as
              the app develops.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Contact
            </h2>
            <p className="mt-3">
              For questions about these terms, contact us at:
              support@flowapp.com
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}