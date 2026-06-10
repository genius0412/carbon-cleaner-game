import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Our Team, Carbon Cleaner" };

// Photos live in /public/team/ (drop the image files there; see render below).
const team = [
  { name: "Dohun Kim", role: "Core Designer & Game Developer", photo: "/team/dohun-kim.png", blurb: "Developer that makes the core functionalities of the game. Has a passion for clean code. Strategic game designer." },
  { name: "Raymond Kwok", role: "Researcher", photo: "/team/raymond-kwok.png", blurb: "Dedicated researcher exploring innovative solutions." },
  { name: "Arnie Sreeram", role: "Game Designer & Developer", photo: "/team/arnie-sreeram.png", blurb: "Creative game designer with a keen eye for detail." },
];

export default function TeamPage() {
  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-5xl px-6 py-12">
	<h1 className="font-display text-4xl font-semibold sm:text-5xl">Our Team</h1>
        <p className="mt-4 max-w-2xl text-lg text-mist">
          The students behind Carbon Cleaner.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-1 lg:grid-cols-3">
          {team.map((m, i) => (
            <Card key={i} className="text-center">
              <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border border-leaf/30 bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.photo} alt={m.name} className="h-full w-full object-cover" />
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
