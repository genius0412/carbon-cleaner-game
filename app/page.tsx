import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { NetZeroCounter } from "@/components/NetZeroCounter";
import { Card } from "@/components/ui/Card";
import { DataChip } from "@/components/ui/DataChip";

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden eco-grid">
      {/* ambient glows + particles */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/4 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-leaf/15 blur-[140px]" />
      <div aria-hidden className="pointer-events-none absolute top-1/3 right-0 h-[30rem] w-[30rem] rounded-full bg-cyan/10 blur-[130px]" />
      {[...Array(8)].map((_, i) => (
        <span
          key={i}
          aria-hidden
          className="particle pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-leaf/40"
          style={{
            left: `${(i * 13 + 8) % 100}%`,
            top: `${(i * 21 + 15) % 90}%`,
            animationDelay: `${i * 0.7}s`,
          }}
        />
      ))}

      <SiteNav />

      {/* Hero */}
      <section className="z-10 flex flex-col items-center px-6 pt-12 pb-16 text-center sm:pt-20">
        <div className="mb-6">
          <NetZeroCounter />
        </div>
        <h1 className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Lead your county to
          <br />
          <span className="text-leaf">net-zero by 2050.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-balance text-lg leading-relaxed text-mist">
          Carbon Cleaner is a climate-strategy game where you govern a fictional
          U.S. county, building clean infrastructure, funding research, passing
          bills, and rallying public support to scrub carbon from the sky before
          time runs out.
        </p>
        <div className="mt-9 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/play"
            className="rounded-full bg-leaf px-9 py-3.5 text-base font-semibold text-night transition-transform hover:scale-105 glow-leaf"
          >
            Play Now
          </Link>
          <Link
            href="/how-to-play"
            className="rounded-full border border-white/15 px-9 py-3.5 text-base font-medium text-fog/90 transition-colors hover:bg-white/5"
          >
            How to Play
          </Link>
        </div>
      </section>

      {/* Why it exists, climate context, global + local */}
      <section className="z-10 mx-auto w-full max-w-6xl px-6 pb-16">
        <h2 className="mb-2 text-center font-display text-2xl font-semibold sm:text-3xl">
          Why Carbon Cleaner exists
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-sm text-mist">
          Climate change is the defining challenge of our generation, global in
          scale, but felt in every local community. The real numbers below tell
          the story. (Amber chips mark figures awaiting cited sources.)
        </p>
        <div className="grid gap-5 md:grid-cols-2">
          <Card glow="leaf">
            <h3 className="font-display text-lg font-semibold text-leaf">
              🌍 The global picture
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-mist">
              <li>
                Atmospheric CO₂ now sits near <DataChip id={1} />, far above the
                stable levels of human history.
              </li>
              <li>
                Global temperatures have risen about <DataChip id={2} /> since the
                pre-industrial era.
              </li>
              <li>
                Humanity emits roughly <DataChip id={3} /> from fossil fuels every
                year.
              </li>
              <li>
                Seas have already risen <DataChip id={4} /> since 1900.
              </li>
            </ul>
          </Card>
          <Card glow="cyan">
            <h3 className="font-display text-lg font-semibold text-cyan">
              🏘️ Your community
            </h3>
            <ul className="mt-3 space-y-2.5 text-sm text-mist">
              <li>
                Transportation drives about <DataChip id={5} /> of U.S. emissions,
                a lever local leaders actually control.
              </li>
              <li>
                The average American emits about <DataChip id={6} /> each year.
              </li>
              <li>
                Extreme heat already strains <DataChip id={7} /> across the country.
              </li>
              <li>
                In Carbon Cleaner, your fictional county of 100,000 people stands in
                for any real community deciding its climate future.
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* Who made it */}
      <section className="z-10 mx-auto w-full max-w-4xl px-6 pb-20 text-center">
        <Card className="mx-auto">
          <h2 className="font-display text-xl font-semibold">Who created this</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-mist">
            Carbon Cleaner was built as an AP World History civic-action project on
            climate change. It pairs a strategy game with a real-world action layer:
            players don't just simulate change, they write to their actual
            representatives. Meet the team on the{" "}
            <Link href="/team" className="text-leaf hover:underline">
              Team page
            </Link>
            .
          </p>
        </Card>
      </section>

      <SiteFooter />
    </main>
  );
}
