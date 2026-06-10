import Link from "next/link";
import { LeafLogo } from "@/components/ui/LeafLogo";
import { AuthNav } from "@/components/auth/AccountLink";
import { FEEDBACK_FORM_URL, ISSUE_FORM_URL } from "@/lib/links";

const links = [
  { href: "/about", label: "About" },
  { href: "/team", label: "Our Team" },
  { href: "/how-to-play", label: "How to Play" },
  { href: "/classroom", label: "Classroom" },
  { href: "/sources", label: "Sources" },
];

export function SiteNav() {
  return (
    <header className="z-20 flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
        <LeafLogo className="h-6 w-6 text-leaf drop-shadow-[0_0_8px_rgba(61,220,132,0.45)]" />
        Carbon Cleaner
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-mist sm:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="transition-colors hover:text-fog">
            {l.label}
          </Link>
        ))}
        {/* Feedback: condensed to one item that drops down on hover/focus. */}
        <div className="group relative">
          <button
            type="button"
            className="inline-flex items-center gap-1 transition-colors hover:text-fog group-hover:text-fog"
          >
            Feedback
            <span aria-hidden className="text-[10px] transition-transform group-hover:rotate-180">
              ▾
            </span>
          </button>
          {/* pt-2 keeps an invisible bridge so the menu stays open while moving the cursor */}
          <div className="invisible absolute right-0 top-full z-30 pt-2 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
            <div className="flex w-52 flex-col rounded-xl border border-white/10 bg-night/95 p-1.5 shadow-xl backdrop-blur">
              <a
                href={FEEDBACK_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-fog"
              >
                General feedback ↗
              </a>
              <a
                href={ISSUE_FORM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 transition-colors hover:bg-white/5 hover:text-fog"
              >
                Report an issue ↗
              </a>
            </div>
          </div>
        </div>
        <AuthNav />
        <Link
          href="/play"
          className="rounded-full bg-leaf px-5 py-2 font-semibold text-night transition-transform hover:scale-105"
        >
          Play
        </Link>
      </nav>
      <div className="flex items-center gap-3 sm:hidden">
        <AuthNav compact />
        <Link
          href="/play"
          className="rounded-full bg-leaf px-4 py-1.5 text-sm font-semibold text-night"
        >
          Play
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="z-10 border-t border-white/8 px-6 py-8 text-center text-xs text-mist sm:px-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-fog">
          <LeafLogo className="h-5 w-5 text-leaf" />
          Carbon Cleaner
        </Link>
        <nav className="flex flex-wrap justify-center gap-5">
          <Link href="/about" className="hover:text-fog">About</Link>
          <Link href="/how-to-play" className="hover:text-fog">How to Play</Link>
          <Link href="/team" className="hover:text-fog">Team</Link>
          <Link href="/sources" className="hover:text-fog">Sources</Link>
          <Link href="/classroom" className="hover:text-fog">Classroom</Link>
          <a
            href={FEEDBACK_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fog"
          >
            Feedback ↗
          </a>
          <a
            href={ISSUE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fog"
          >
            Report an issue ↗
          </a>
        </nav>
        <p>
          Carbon Cleaner · An AP World History civic-action project on climate change ·
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
