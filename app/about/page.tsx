import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";
import { DataChip } from "@/components/ui/DataChip";

export const metadata = { title: "About, Carbon Cleaner" };

export default function AboutPage() {
  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <article className="z-10 mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Understanding climate change
        </h1>
        <p className="mt-4 text-lg text-mist">
          The science behind the game, and why we set it in a county like yours.
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
            And the effects feed on each other. Oceans warm and expand, ice
            sheets melt, and sea levels have already risen about{" "}
            <DataChip id={4} /> since 1900. Heatwaves, droughts, wildfires, and
            stronger storms keep getting more frequent and more severe.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-cyan">
            Why local action matters
          </h2>
          <p className="text-fog/90 leading-relaxed">
            Climate change is global, but emissions come from local choices, how
            we get around, power our homes, and build our towns. Transportation
            alone accounts for about <DataChip id={5} /> of U.S. emissions, and
            the average American emits roughly <DataChip id={6} /> per year, well
            above the global average. Extreme heat already affects{" "}
            <DataChip id={7} />, hitting vulnerable communities hardest.
          </p>
          <p className="text-fog/90 leading-relaxed">
            That's where Carbon Cleaner starts. One county of 100,000 people,
            running on carbon today but holding every tool it needs to change
            course. It stands in for <em>your</em> community, and the decisions
            in the game are the same ones real local governments wrestle with.
          </p>
        </section>

        <section className="mt-10">
          <Card glow="leaf">
            <h2 className="font-display text-2xl font-semibold">
              What we set out to do
            </h2>
            <p className="mt-4 text-fog/90 leading-relaxed">
              We wanted a game that teaches real climate impacts with real,
              cited numbers instead of invented ones, where every action is
              something a county could actually do. And we wanted it to push
              players past the screen. You write a real letter to a real
              representative, and the report you finish with is something you
              can hand to a parent, a teacher, or a council member.
            </p>
          </Card>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
