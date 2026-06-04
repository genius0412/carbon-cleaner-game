import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";
import { DataChip } from "@/components/ui/DataChip";

export const metadata = { title: "About — Carbon Cleaner" };

export default function AboutPage() {
  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <article className="z-10 mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Understanding climate change
        </h1>
        <p className="mt-4 text-lg text-mist">
          A grounding in the science and stakes behind the game — global, then
          local. Amber chips are real figures awaiting cited sources.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-leaf">
            What is happening
          </h2>
          <p className="text-fog/90 leading-relaxed">
            When we burn coal, oil, and gas, we release carbon dioxide (CO₂) and
            other greenhouse gases that trap heat in the atmosphere. CO₂
            concentrations have climbed to roughly <DataChip id={1} />, and the
            planet has warmed about <DataChip id={2} /> since the pre-industrial
            era. Each year, fossil fuels add about <DataChip id={3} /> to the
            atmosphere.
          </p>
          <p className="text-fog/90 leading-relaxed">
            The consequences compound: oceans warm and expand, ice sheets melt,
            and sea levels have already risen about <DataChip id={4} /> since
            1900. Heatwaves, droughts, wildfires, and stronger storms grow more
            frequent and more severe.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-cyan">
            Why local action matters
          </h2>
          <p className="text-fog/90 leading-relaxed">
            Climate change is global, but emissions come from local choices — how
            we get around, power our homes, and build our towns. Transportation
            alone accounts for about <DataChip id={5} /> of U.S. emissions, and
            the average American emits roughly <DataChip id={6} /> per year, well
            above the global average. Extreme heat already affects{" "}
            <DataChip id={7} />, hitting vulnerable communities hardest.
          </p>
          <p className="text-fog/90 leading-relaxed">
            That is the premise of Carbon Cleaner: a single county of 100,000
            people, carbon-dependent today, with the tools to change course. The
            county stands in for <em>your</em> community — the decisions are the
            same ones real local governments face.
          </p>
        </section>

        <section className="mt-10">
          <Card glow="leaf">
            <h2 className="font-display text-2xl font-semibold">
              The project's goals
            </h2>
            <ul className="mt-4 space-y-3 text-fog/90">
              <li>
                <strong className="text-leaf">Understand</strong> — teach real
                climate impacts at both global and local scales.
              </li>
              <li>
                <strong className="text-leaf">Use data</strong> — present real,
                cited numbers, never invented ones.
              </li>
              <li>
                <strong className="text-leaf">Propose solutions</strong> — every
                in-game action is a concrete, real-world climate intervention.
              </li>
              <li>
                <strong className="text-leaf">Take civic action</strong> — players
                write to real representatives and produce a shareable report for
                stakeholders.
              </li>
            </ul>
          </Card>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
