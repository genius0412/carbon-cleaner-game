import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Privacy Policy, Carbon Cleaner" };

const UPDATED = "June 11, 2026";
const CONTACT = "genius0412.tech@gmail.com";

export default function PrivacyPage() {
  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <article className="z-10 mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-4 text-lg text-mist">
          Last updated {UPDATED}. This explains what Carbon Cleaner collects and
          what we do with it, in plain language.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-leaf">
            Who we are
          </h2>
          <p className="text-fog/90 leading-relaxed">
            Carbon Cleaner is a free climate strategy game built by students as
            an AP World History civic-action project. We are not a company, and
            we are not selling anything. We only keep the information we need to
            run the game and let teachers follow their classes.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-cyan">
            What we collect
          </h2>
          <p className="text-fog/90 leading-relaxed">
            You can play the whole game without an account. If you do, your
            progress stays on your own device and never reaches us. When you
            choose to sign up or join a class, we collect:
          </p>
          <ul className="space-y-2.5 text-fog/90 leading-relaxed">
            <li>
              The email address you sign up with, plus a username and a display
              name you pick.
            </li>
            <li>
              Your game progress, including the county name you choose, the
              decisions you make, and whether you reached net-zero.
            </li>
            <li>
              The class you belong to, if a teacher invites you to one.
            </li>
            <li>
              Any screenshot you upload as proof of your civic action, such as a
              photo of the letter you wrote.
            </li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-leaf">
            How we use it
          </h2>
          <p className="text-fog/90 leading-relaxed">
            We use this information to save your game, show the public
            leaderboard, and let a teacher see how their own class is doing. We
            do not run ads, and we do not sell or trade your information to
            anyone.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-cyan">
            What other people can see
          </h2>
          <p className="text-fog/90 leading-relaxed">
            The leaderboard is public. When you reach net-zero, your display
            name, your county name, your role, and the date you finished can
            appear there for anyone to see. Pick a display name you are
            comfortable showing publicly. If you join a class, your teacher can
            see your progress in that class. Your email address is never shown to
            other players.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-leaf">
            Where it is stored
          </h2>
          <p className="text-fog/90 leading-relaxed">
            We use trusted third-party services to host the game and store
            accounts and saves. We take reasonable steps to keep your
            information safe, but no online service can promise perfect security.
            To stay signed in, we keep a small amount of data in your browser. We
            do not use it to track you across other sites.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-cyan">
            A note for younger players
          </h2>
          <p className="text-fog/90 leading-relaxed">
            Carbon Cleaner is made for classrooms, and some players are young. If
            you are a student, use it with your teacher or a parent, and only
            share a display name and county name you are happy to show in public.
            If you are a parent or teacher and want a child's account and data
            removed, email us and we will take care of it.
          </p>
        </section>

        <section className="mt-10">
          <Card glow="leaf">
            <h2 className="font-display text-2xl font-semibold">
              Your choices and how to reach us
            </h2>
            <p className="mt-4 text-fog/90 leading-relaxed">
              You can edit your display name any time, and you can play without
              an account at all. If you want to see what we hold, fix it, or
              delete your account and everything tied to it, email us at{" "}
              <a
                href={`mailto:${CONTACT}`}
                className="text-leaf hover:underline"
              >
                {CONTACT}
              </a>{" "}
              and we will sort it out. If we ever change this policy, we will
              update the date at the top. See our{" "}
              <Link href="/terms" className="text-leaf hover:underline">
                Terms and Conditions
              </Link>{" "}
              for the rules of using the game.
            </p>
          </Card>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
