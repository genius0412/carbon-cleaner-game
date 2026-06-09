import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";
import Link from "next/link";

export const metadata = { title: "How to Play, Carbon Cleaner" };

const gauges = [
  { name: "Year / Month", desc: "The clock runs Jan 2025 → Dec 2050. At 1x, one in-game month passes per real minute." },
  { name: "Carbon Gain / Month", desc: "The key metric: how much CO₂ (ppm) your county adds each month. Drive it to ≤ 0.00 to win." },
  { name: "Current Carbon (ppm)", desc: "Starts at 430. If it hits 600, the game is lost." },
  { name: "Population Support", desc: "0–100%, starts at 65%. Below 50% bills can't pass; below 30% residents undermine progress." },
  { name: "Budget", desc: "Starts at $2M (Mayor), plus a steady monthly municipal grant. Every project draws from it." },
];

export default function HowToPlayPage() {
  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <section className="z-10 mx-auto w-full max-w-4xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">How to Play</h1>
        <p className="mt-4 max-w-2xl text-lg text-mist">
          Your mandate: reach net-zero carbon by 2050 without losing the public's
          trust.
        </p>

        <h2 className="mt-10 font-display text-2xl font-semibold text-leaf">The gauges</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {gauges.map((g) => (
            <Card key={g.name}>
              <h3 className="font-display font-semibold text-fog">{g.name}</h3>
              <p className="mt-1 text-sm text-mist">{g.desc}</p>
            </Card>
          ))}
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold text-leaf">Controls</h2>
        <Card className="mt-4">
          <ul className="space-y-2 text-sm text-fog/90">
            <li><strong>Pause / Play</strong>, stop or resume the clock.</li>
            <li><strong>Speed</strong>, 1x, 1.5x, or 2.5x.</li>
            <li><strong>Skip Forward</strong>, jump ahead one full year.</li>
            <li><strong>Auto-pause</strong>, time freezes automatically whenever you open an action panel, and resumes when you close it.</li>
            <li><strong>The map</strong>, drag to pan, scroll or use the buttons to zoom. Click any region to act. One infrastructure per region.</li>
          </ul>
        </Card>

        <h2 className="mt-12 font-display text-2xl font-semibold text-leaf">Modes</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Card>
            <h3 className="font-display font-semibold text-fog">🏛️ Mayor</h3>
            <p className="mt-1 text-sm text-mist">Full powers: the Shop, Research Corporations, Bills, and Tree Planting. The complete strategy loop.</p>
          </Card>
          <Card>
            <h3 className="font-display font-semibold text-fog">🎓 Older Student</h3>
            <p className="mt-1 text-sm text-mist">Smaller budget, local actions only. Progress mainly through advocacy, write your own letter from real data and submit proof for a big boost.</p>
          </Card>
          <Card>
            <h3 className="font-display font-semibold text-fog">📚 Younger Student</h3>
            <p className="mt-1 text-sm text-mist">Simplified play. Build a letter by dragging pre-written sentence blocks into order, then send it for real.</p>
          </Card>
        </div>

        <h2 className="mt-12 font-display text-2xl font-semibold text-leaf">Win &amp; lose</h2>
        <Card className="mt-4">
          <p className="text-sm text-fog/90">
            <strong className="text-leaf">Win</strong> by getting Carbon Gain/Month to ≤ 0.00 any time before December 2050 (with at least minimal governing support).
            <br />
            <strong className="text-danger">Lose</strong> if you reach January 2051 without net-zero, or if Current Carbon hits 600 ppm.
          </p>
        </Card>

        <div className="mt-12 text-center">
          <Link href="/play" className="rounded-full bg-leaf px-8 py-3 font-semibold text-night glow-leaf">
            Start Playing
          </Link>
        </div>
      </section>
      <SiteFooter />
    </main>
  );
}
