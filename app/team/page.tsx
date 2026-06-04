import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Our Team — Carbon Cleaner" };

// [FILL IN] team members — replace placeholders with real names/roles/photos.
const team = [
  { name: "[FILL IN — Name]", role: "[FILL IN — Role]", blurb: "[FILL IN — one line about this member]" },
  { name: "[FILL IN — Name]", role: "[FILL IN — Role]", blurb: "[FILL IN — one line about this member]" },
  { name: "[FILL IN — Name]", role: "[FILL IN — Role]", blurb: "[FILL IN — one line about this member]" },
  { name: "[FILL IN — Name]", role: "[FILL IN — Role]", blurb: "[FILL IN — one line about this member]" },
];

export default function TeamPage() {
  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">Our Team</h1>
        <p className="mt-4 max-w-2xl text-lg text-mist">
          The students behind Carbon Cleaner. Replace these placeholders with
          your real names, roles, and photos.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m, i) => (
            <Card key={i} className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-amber/40 bg-amber/10 text-xs text-amber">
                [FILL IN photo]
              </div>
              <h3 className="font-display text-lg font-semibold text-fog">{m.name}</h3>
              <p className="mt-1 text-sm text-leaf">{m.role}</p>
              <p className="mt-2 text-xs text-mist">{m.blurb}</p>
            </Card>
          ))}
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
