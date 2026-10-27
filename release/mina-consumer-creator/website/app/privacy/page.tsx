import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-16 text-white">
      <section className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-cyan-300/80">
          ← Back to Flux
        </Link>

        <h1 className="mt-8 text-4xl font-black md:text-6xl">
          Privacy Policy
        </h1>

        <p className="mt-6 text-white/50">Last updated: October 22, 2026</p>

        <div className="mt-10 space-y-8 text-lg leading-8 text-white/60">
          <p>
            Flux is designed to help users improve focus, study routines, sleep,
            and recovery using personalized audio experiences.
          </p>

          <section>
            <h2 className="text-2xl font-black text-white">Mina Tests personal challenges</h2>
            <p className="mt-3">Mina Tests saves your assigned activities, challenge progress,
              server session start/end times, playback duration and interruptions, optional cognitive game scores, timezone, adult eligibility confirmation,
              and short sleep check-ins to provide your personal comparisons. These are
              personal app data. Other users cannot read your individual answers. We do
              not need your date of birth or an exact age for adult personal challenges.</p>
            <p className="mt-3">You can skip a night or stop a challenge in the app. Stopping
              prevents further tracking; it retains previously saved observations until
              you delete them. Account deletion in Flux Settings removes your challenge
              data and pending local responses. If cleanup fails, the account is retained
              so deletion can be retried. Contact support if you cannot access your account.</p>
            <p className="mt-3">Operators may use aggregate participation, completion and
              technical-error information to operate the feature. Where the challenge’s Start explanation discloses it, operators can also see condition averages from numeric check-ins, with each participant weighted equally. Individual answers are not published, small groups are suppressed, and account deletion removes the underlying contributions. Older plans without this disclosure are excluded. These operational summaries are personal observations, not medical evidence. Personal challenge
              tracking does not itself authorize reuse for generalizable research.
              Any such research needs a separately reviewed purpose, disclosure and
              appropriate permission before data are reused.</p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">Optional YouTube videos</h2>
            <p className="mt-3">Mina videos may use YouTube’s embedded player. Google may process device and network information, cookies or identifiers when a video loads or plays. We do not send your private challenge answers to YouTube. You can use the text experience without watching videos.</p>
            <p><a href="https://policies.google.com/privacy" className="text-cyan-300">Google Privacy Policy</a> · <a href="https://www.youtube.com/t/terms" className="text-cyan-300">YouTube Terms of Service</a></p>
          </section>

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
              sleep experiences, analyze app performance, and improve the Flux
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
              contacting the Flux support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-white">
              Contact
            </h2>
            <p className="mt-3">
              For privacy questions, contact us at: alankelly@chiasmatic.co
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
