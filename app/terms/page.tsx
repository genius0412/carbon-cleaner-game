import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/SiteNav";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Terms and Conditions, Carbon Cleaner" };

const UPDATED = "June 11, 2026";
const CONTACT = "genius0412.tech@gmail.com";

export default function TermsPage() {
  return (
    <main className="relative flex min-h-screen flex-col eco-grid">
      <SiteNav />
      <article className="z-10 mx-auto w-full max-w-3xl px-6 py-12">
        <h1 className="font-display text-4xl font-semibold sm:text-5xl">
          Terms and Conditions
        </h1>
        <p className="mt-4 text-lg text-mist">
          Last updated {UPDATED}. These are the simple rules for using Carbon
          Cleaner. By playing, you agree to them.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-leaf">
            What Carbon Cleaner is
          </h2>
          <p className="text-fog/90 leading-relaxed">
            Carbon Cleaner is a free educational game built by students for an AP
            World History civic-action project. It is a simulation of a fictional
            U.S. county. The numbers behind it come from cited real-world
            sources, but the game is a learning tool, not professional or policy
            advice. We offer it as it is, and it may change or go offline as a
            school project sometimes does.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-cyan">
            Your account
          </h2>
          <p className="text-fog/90 leading-relaxed">
            You can play without an account. If you make one, give accurate
            information and keep your login to yourself. You are responsible for
            what happens under your account. Younger players should sign up with
            help from a teacher or a parent.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-leaf">
            Playing fair
          </h2>
          <p className="text-fog/90 leading-relaxed">
            Some of what you enter is shown to other people, like your display
            name and county name on the leaderboard, so keep those clean and
            respectful. Do not upload anything harmful, hateful, or
            inappropriate, and do not upload images that are not yours to share.
            Do not try to break, overload, or tamper with the game or other
            players' accounts. We can remove content or close an account that
            breaks these rules.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-cyan">
            Your content
          </h2>
          <p className="text-fog/90 leading-relaxed">
            Anything you create or upload stays yours, including the letter you
            write and any screenshot you add as proof of your civic action. By
            posting it, you give us permission to store and display it where the
            game needs to, such as your classroom view. The letter you write to a
            representative is yours to send. Carbon Cleaner helps you write it and
            does not send it on your behalf.
          </p>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="font-display text-2xl font-semibold text-leaf">
            No guarantees
          </h2>
          <p className="text-fog/90 leading-relaxed">
            We work to keep Carbon Cleaner running and accurate, but we provide
            it without warranties of any kind. We are not liable for losses that
            come from using it, to the extent the law allows. If a part of these
            terms cannot be enforced, the rest still applies.
          </p>
        </section>

        <section className="mt-10">
          <Card glow="leaf">
            <h2 className="font-display text-2xl font-semibold">
              Changes and contact
            </h2>
            <p className="mt-4 text-fog/90 leading-relaxed">
              We may update these terms, and we will change the date at the top
              when we do. Keeping on playing after a change means you accept it.
              Questions go to{" "}
              <a
                href={`mailto:${CONTACT}`}
                className="text-leaf hover:underline"
              >
                {CONTACT}
              </a>
              . To see how we handle your information, read our{" "}
              <Link href="/privacy" className="text-leaf hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </Card>
        </section>
      </article>
      <SiteFooter />
    </main>
  );
}
