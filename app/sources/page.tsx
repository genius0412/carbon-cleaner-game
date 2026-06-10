import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { SourcesExport } from "@/components/SourcesExport";
import { aggregatedSources } from "@/lib/config/dataBlanks";

export const metadata = { title: "Sources & Bibliography, Carbon Cleaner" };

export default function SourcesPage() {
  const sources = aggregatedSources();

  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Sources &amp; Bibliography
        </h1>
        <p className="mt-4 text-lg text-mist">
          Every real-world figure in Carbon Cleaner comes from a published
          source, cited MLA-style below. All the sources were hand-picked by our research team.
        </p>

        <SourcesExport sources={sources.map((s) => s.source)} />

        <h2 className="mt-10 font-display text-2xl font-semibold text-leaf">
          Works Cited
        </h2>
        <ol className="mt-4 space-y-4">
          {sources.map((s, i) => (
            <li key={i} className="glass rounded-xl p-4">
              {/* MLA hanging-indent style */}
              <p className="text-sm text-fog [text-indent:-1.5rem] [padding-left:1.5rem]">
                {s.source}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <SiteFooter />
    </main>
  );
}
