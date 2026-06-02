export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden">
      {/* ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-leaf/20 blur-[120px]"
      />

      <header className="z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <span className="flex items-center gap-2 text-sm font-medium tracking-wide">
          <span className="h-2.5 w-2.5 rounded-full bg-leaf shadow-[0_0_12px] shadow-leaf" />
          Carbon Cleaner
        </span>
        <nav className="hidden gap-8 text-sm text-mist sm:flex">
          <a className="transition-colors hover:text-white" href="#play">
            Play
          </a>
          <a className="transition-colors hover:text-white" href="#about">
            About
          </a>
        </nav>
      </header>

      <section className="z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="mb-5 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-mist">
          Early Access
        </p>

        <h1 className="max-w-3xl text-balance text-5xl font-semibold leading-tight tracking-tight sm:text-7xl">
          Scrub the skies,
          <br />
          <span className="text-leaf">clear the carbon.</span>
        </h1>

        <p className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-mist">
          A relaxed strategy game about cleaning a polluted world — capture
          emissions, restore ecosystems, and watch the planet breathe again.
        </p>

        <div id="play" className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <button className="rounded-full bg-leaf px-8 py-3 text-sm font-semibold text-night transition-transform hover:scale-105 active:scale-100">
            Start Cleaning
          </button>
          <button className="rounded-full border border-white/15 px-8 py-3 text-sm font-medium text-white/90 transition-colors hover:bg-white/5">
            Watch Trailer
          </button>
        </div>
      </section>

      <footer
        id="about"
        className="z-10 px-6 pb-8 text-center text-xs text-mist sm:px-10"
      >
        Built for a cleaner tomorrow · © {new Date().getFullYear()} Carbon Cleaner
      </footer>
    </main>
  );
}
