import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";
import { allBlanks, aggregatedSources, blankTag } from "@/lib/config/dataBlanks";

export const metadata = { title: "Sources & Bibliography — Carbon Cleaner" };

/**
 * Sources page — auto-aggregated from the `source` fields in dataBlanks.ts.
 * As the human fills in each blank's citation (MLA-style), it appears here
 * automatically, NoodleTools-friendly.
 */
export default function SourcesPage() {
  const sources = aggregatedSources();
  const blanks = allBlanks();
  const filled = blanks.filter((b) => b.value !== null);

  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Sources &amp; Bibliography
        </h1>
        <p className="mt-4 text-lg text-mist">
          Every real-world figure in Carbon Cleaner is backed by a cited source.
          This list is generated automatically from the game's data registry and
          formatted MLA-style for NoodleTools.
        </p>

        <Card className="mt-8">
          <p className="text-sm text-mist">
            <strong className="text-fog">{filled.length}</strong> of{" "}
            <strong className="text-fog">{blanks.length}</strong> data points
            filled in · <strong className="text-fog">{sources.length}</strong>{" "}
            distinct sources cited.
          </p>
        </Card>

        <h2 className="mt-10 font-display text-2xl font-semibold text-leaf">
          Works Cited
        </h2>
        {sources.length === 0 ? (
          <Card className="mt-4">
            <p className="text-sm text-amber">
              No sources cited yet. As each data blank is filled in with a
              citation (in <code>lib/config/dataBlanks.ts</code>), its source will
              appear here automatically. See <code>DATA_TO_FILL.md</code> for the
              full checklist.
            </p>
          </Card>
        ) : (
          <ol className="mt-4 space-y-4">
            {sources.map((s, i) => (
              <li key={i} className="glass rounded-xl p-4">
                {/* MLA hanging-indent style */}
                <p className="text-sm text-fog [text-indent:-1.5rem] [padding-left:1.5rem]">
                  {s.source}
                </p>
                <p className="mt-1 text-xs text-mist">
                  Cited for data {s.blankIds.map((id) => blankTag(id)).join(", ")}
                </p>
              </li>
            ))}
          </ol>
        )}

        <h2 className="mt-12 font-display text-2xl font-semibold text-amber">
          Data points still needing sources
        </h2>
        <Card className="mt-4">
          <ul className="space-y-2 text-sm">
            {blanks
              .filter((b) => !b.source)
              .map((b) => (
                <li key={b.id} className="flex gap-2 text-mist">
                  <span className="font-mono text-amber">{blankTag(b.id)}</span>
                  <span>
                    {b.label} <span className="text-mist/60">({b.unit})</span>
                  </span>
                </li>
              ))}
          </ul>
        </Card>
      </section>
      <SiteFooter />
    </main>
  );
}
