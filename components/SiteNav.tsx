import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/how-to-play", label: "How to Play" },
  { href: "/team", label: "Team" },
  { href: "/sources", label: "Sources" },
];

export function SiteNav() {
  return (
    <header className="z-20 flex items-center justify-between px-6 py-5 sm:px-10">
      <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-wide">
        <span className="h-2.5 w-2.5 rounded-full bg-leaf shadow-[0_0_12px] shadow-leaf" />
        Carbon Cleaner
      </Link>
      <nav className="hidden items-center gap-7 text-sm text-mist sm:flex">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="transition-colors hover:text-fog">
            {l.label}
          </Link>
        ))}
        <Link
          href="/play"
          className="rounded-full bg-leaf px-5 py-2 font-semibold text-night transition-transform hover:scale-105"
        >
          Play
        </Link>
      </nav>
      <Link
        href="/play"
        className="rounded-full bg-leaf px-4 py-1.5 text-sm font-semibold text-night sm:hidden"
      >
        Play
      </Link>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="z-10 border-t border-white/8 px-6 py-8 text-center text-xs text-mist sm:px-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-3">
        <nav className="flex flex-wrap justify-center gap-5">
          <Link href="/about" className="hover:text-fog">About</Link>
          <Link href="/how-to-play" className="hover:text-fog">How to Play</Link>
          <Link href="/team" className="hover:text-fog">Team</Link>
          <Link href="/sources" className="hover:text-fog">Sources</Link>
          <Link href="/classroom" className="hover:text-fog">Classroom</Link>
        </nav>
        <p>
          Carbon Cleaner · An AP World History civic-action project on climate change ·
          © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
