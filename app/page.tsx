import Link from 'next/link'

const useCases = [
  {
    eyebrow: 'Sleep',
    title: 'A calmer wind-down experience.',
    text: 'Use Flow at night to create a reliable pre-sleep audio routine that feels immersive, quiet, and easy to repeat.',
  },
  {
    eyebrow: 'Study',
    title: 'Sound environments for deeper focus.',
    text: 'Use Flow during revision or study blocks to reduce distraction and create smoother, more consistent focus sessions.',
  },
]

const studySteps = [
  'Pick a base sound you naturally enjoy listening to',
  'Play Flow’s short cognitive testing games',
  'The sound subtly changes as you focus',
  'Flow learns what improves focus and memory',
  'Guided study sessions become personalized over time',
  'Simple.',
]

const sleepSteps = [
  'Choose the soundscape you find most relaxing',
  'Begin a personalized sleep sound experiment',
  'Flow subtly refines the soundscape each night',
  'Small changes in sound behaviour are tested',
  'Play our brain testing games and morning check',
  'Flow learns how sound improves your sleep',
  'Better sleep. Better cognition. No wearables required.',
]

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden text-white">
      {/* ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-10rem] top-[-8rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute right-[-8rem] top-[6rem] h-[22rem] w-[22rem] rounded-full bg-cyan-400/10 blur-[110px]" />
        <div className="absolute bottom-[-12rem] left-1/2 h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-[140px]" />
      </div>

      {/* nav */}
      <header className="relative z-10">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 sm:py-6">
          <a href="#" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="absolute inset-x-2 bottom-2 top-2 flex items-end justify-between">
                {[0.45, 0.75, 1, 0.65, 0.85].map((h, i) => (
                  <span
                    key={i}
                    className="w-[3px] rounded-full bg-gradient-to-b from-cyan-300 to-indigo-500"
                    style={{ height: `${h * 18}px` }}
                  />
                ))}
              </div>
            </div>
            <span className="text-2xl font-black tracking-tight">Flow</span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-semibold text-white/55 md:flex">
            <a href="#use-cases" className="transition hover:text-white">
              Use cases
            </a>
            <a href="#study-sleep" className="transition hover:text-white">
              How it works
            </a>
            <a
              href="#download"
              className="rounded-full border border-white/10 bg-white/7 px-5 py-2.5 text-white backdrop-blur transition hover:bg-white/10"
            >
              Download
            </a>
          </div>
        </nav>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-4 pb-20 pt-8 sm:px-6 md:grid-cols-[1fr_1fr] md:gap-16 md:pb-24 md:pt-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-cyan-200 backdrop-blur">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(69,215,255,0.9)]" />
            Personalized audio for focus and sleep
          </div>

          <h1 className="mt-7 max-w-5xl text-5xl font-black leading-[0.92] tracking-[-0.05em] sm:text-6xl md:text-7xl">
            Your brain
            <br />
            trains the sound.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/58 md:text-xl">
            Flow uses focus sessions, sleep experiments, and cognitive feedback
            to create personalized audio environments that evolve over time.
          </p>

          <div className="mt-10">
            <a
              href="#download"
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-8 py-4 text-base font-bold text-white shadow-[0_12px_40px_rgba(108,99,255,0.30)] transition hover:scale-[1.02]"
            >
              Download now — it&apos;s free
            </a>
          </div>
        </div>

        {/* right portrait demo */}
        <div className="relative mx-auto flex w-full justify-center">
          <div className="absolute top-10 h-[420px] w-[260px] rounded-full bg-indigo-500/20 blur-[120px] sm:h-[500px] sm:w-[320px]" />

          <div className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#06070c] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:rounded-[3.2rem] sm:p-3">
            <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-black sm:rounded-[2.5rem]">
              <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black sm:h-6 sm:w-32" />

              <div className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-bold text-cyan-200 backdrop-blur">
                Live Demo
              </div>

              <video
                className="h-[560px] w-[265px] object-cover sm:h-[640px] sm:w-[300px] md:h-[720px] md:w-[340px]"
                autoPlay
                muted
                loop
                playsInline
                poster="/images/demo-poster.png"
              >
                <source src="/videos/flow-demo.mp4" type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      </section>

      {/* use cases */}
      <section id="use-cases" className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-6 md:grid-cols-2">
          {useCases.map((item, index) => (
            <div
              key={item.eyebrow}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl sm:rounded-[2.4rem] sm:p-8 md:p-10"
            >
              <div
                className={`absolute inset-0 ${
                  index === 0
                    ? 'bg-[radial-gradient(circle_at_top_left,rgba(108,99,255,0.16),transparent_45%)]'
                    : 'bg-[radial-gradient(circle_at_top_right,rgba(69,215,255,0.13),transparent_42%)]'
                }`}
              />
              <div className="relative">
                <p className="text-sm font-bold uppercase tracking-[0.3em] text-white/42">
                  {item.eyebrow}
                </p>
                <h3 className="mt-4 max-w-md text-3xl font-black leading-tight">
                  {item.title}
                </h3>
                <p className="mt-5 max-w-lg leading-8 text-white/52">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Study + Sleep video sections */}
      <section id="study-sleep" className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="space-y-12">
          {/* Study */}
          <div className="grid items-center gap-10 rounded-[2.2rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:rounded-[2.8rem] sm:p-6 md:grid-cols-2 md:p-10">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300/70">
                Study Flow
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Train your brain to focus longer.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/55">
                Personalized sound environments built around how your brain
                responds to audio during study sessions.
              </p>

              <div className="mt-10 space-y-4">
                {studySteps.map((step, index) => (
                  <div
                    key={step}
                    className="type-step rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur sm:px-5"
                    style={{
                      animationDelay: `${index * 1.15}s`,
                    }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-xs font-black text-cyan-200">
                        {index + 1}
                      </div>

                      <p
                        className="typewriter-text leading-7 text-white/72"
                        style={{
                          animationDelay: `${index * 1.15 + 0.25}s`,
                        }}
                      >
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto flex w-full justify-center">
              <div className="absolute top-10 h-[390px] w-[250px] rounded-full bg-cyan-400/15 blur-[110px] sm:h-[460px] sm:w-[300px]" />

              <div className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#06070c] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:rounded-[3.2rem] sm:p-3">
                <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-black sm:rounded-[2.5rem]">
                  <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black sm:h-6 sm:w-32" />

                  <div className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-bold text-cyan-200 backdrop-blur">
                    Study Demo
                  </div>

                  <video
                    className="h-[520px] w-[250px] object-cover sm:h-[580px] sm:w-[280px] md:h-[620px] md:w-[300px]"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/images/study-poster.png"
                  >
                    <source src="/videos/study_demo.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Sleep */}
          <div className="grid items-center gap-10 rounded-[2.2rem] border border-white/10 bg-white/[0.03] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.38)] backdrop-blur-xl sm:rounded-[2.8rem] sm:p-6 md:grid-cols-2 md:p-10">
            <div className="relative order-2 mx-auto flex w-full justify-center md:order-1">
              <div className="absolute top-10 h-[390px] w-[250px] rounded-full bg-indigo-500/15 blur-[110px] sm:h-[460px] sm:w-[300px]" />

              <div className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#06070c] p-2 shadow-[0_40px_120px_rgba(0,0,0,0.65)] sm:rounded-[3.2rem] sm:p-3">
                <div className="overflow-hidden rounded-[2.2rem] border border-white/10 bg-black sm:rounded-[2.5rem]">
                  <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black sm:h-6 sm:w-32" />

                  <div className="absolute left-5 top-5 z-10 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs font-bold text-indigo-200 backdrop-blur">
                    Sleep Demo
                  </div>

                  <video
                    className="h-[520px] w-[250px] object-cover sm:h-[580px] sm:w-[280px] md:h-[620px] md:w-[300px]"
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster="/images/sleep-poster.png"
                  >
                    <source src="/videos/sleep_demo.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-indigo-300/70">
                Sleep Flow
              </p>

              <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
                Optimize sleep. Upgrade tomorrow.
              </h2>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/55">
                Personalized sleep sound experiments designed to improve
                recovery, cognition, and next-day mental performance.
              </p>

              <div className="mt-10 space-y-4">
                {sleepSteps.map((step, index) => (
                  <div
                    key={step}
                    className="type-step rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 backdrop-blur sm:px-5"
                    style={{
                      animationDelay: `${index * 1.15}s`,
                    }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-indigo-300/20 bg-indigo-300/10 text-xs font-black text-indigo-200">
                        {index + 1}
                      </div>

                      <p
                        className="typewriter-text leading-7 text-white/72"
                        style={{
                          animationDelay: `${index * 1.15 + 0.25}s`,
                        }}
                      >
                        {step}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="download" className="relative z-10 mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] px-6 py-12 shadow-[0_30px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:rounded-[3rem] md:px-14 md:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(108,99,255,0.14),transparent_35%)]" />

          <div className="relative text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-cyan-300/70">
              Download Flow
            </p>

            <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
              Personalized audio
              <br />
              trained by your brain.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/55">
              Study deeper, focus longer, and optimize sleep with adaptive
              sound environments that evolve over time.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <a
                href="#"
                className="flex min-h-14 w-full items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-8 text-sm font-bold text-white backdrop-blur transition hover:bg-white/[0.08] sm:w-auto"
              >
                Download on the App Store
              </a>

              <a
                href="#"
                className="flex min-h-14 w-full items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 px-8 text-sm font-bold text-white shadow-[0_12px_35px_rgba(108,99,255,0.30)] transition hover:scale-[1.02] sm:w-auto"
              >
                Get it on Google Play
              </a>
            </div>

            <p className="mt-6 text-sm text-white/35">Free to download</p>
          </div>
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6">
        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-5 md:flex-row">
            <p className="text-center text-sm font-semibold text-white/30 md:text-left">
              © 2026 Flow. Calibrated audio for sleep and study.
            </p>

            <div className="flex items-center gap-6 text-sm font-semibold text-white/45">
              <Link href="/privacy" className="transition hover:text-white">
                Privacy
              </Link>

              <Link href="/terms" className="transition hover:text-white">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
