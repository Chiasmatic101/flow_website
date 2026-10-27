import Link from 'next/link'

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-16 text-white">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-cyan-300/80">
          ← Back to Flux
        </Link>

        <h1 className="mt-8 text-4xl font-black md:text-6xl">
          Terms & Conditions
        </h1>

        <p className="mt-6 text-white/50">Last updated: October 22, 2026</p>

        <div className="mt-10 space-y-8 text-lg leading-8 text-white/60">
          <section><h2 className="text-2xl font-black text-white">Optional YouTube videos</h2><p className="mt-3">Flux uses YouTube API Services for optional Mina videos. By using these YouTube video features, you agree to be bound by the <a href="https://www.youtube.com/t/terms" className="text-cyan-300">YouTube Terms of Service</a>. The <a href="https://policies.google.com/privacy" className="text-cyan-300">Google Privacy Policy</a> also applies. You can use personal challenges without watching videos.</p></section>
          <p>
            These Terms & Conditions govern your use of Flux, an audio-based
            focus, study, sleep, and recovery app.
          </p>

          <section>
            <h2 className="text-2xl font-black text-white">Mina Tests challenges</h2>
            <p className="mt-3">Mina Tests offers optional personal challenges for adults
              aged 18 or older. Starting a challenge is a choice to track your own
              experience. It is not enrollment in a clinical trial. Sleep check-ins
              and comparisons describe your observations; they cannot prove that a
              sound caused a change or establish a validated sleep treatment.</p>
            <p className="mt-3">Keep audio at a comfortable volume. You can skip nights
              and stop a challenge at any time. Missing or interrupted observations
              may limit your results; Flux does not promise a benefit. Participation
              does not by itself grant permission for generalizable research.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Use of Flux
            </h2>
            <p className="mt-3">
              Flux is intended for general wellbeing, productivity, study, and
              sleep support. You agree to use the app responsibly and only for
              lawful purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Not medical advice
            </h2>
            <p className="mt-3">
              Flux is not a medical device and does not provide medical advice,
              diagnosis, or treatment. If you have concerns about sleep, health,
              or mental wellbeing, consult a qualified professional.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Results may vary
            </h2>
            <p className="mt-3">
              Flux uses personalized audio experiences, but individual outcomes
              may vary. We do not guarantee specific improvements in sleep,
              focus, cognition, or academic performance.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Changes to the service
            </h2>
            <p className="mt-3">
              We may update, modify, or discontinue features of Flux over time as
              the app develops.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Contact
            </h2>
            <p className="mt-3">
              For questions about these terms, contact us at:
              alankelly@chiasmatic.co
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
