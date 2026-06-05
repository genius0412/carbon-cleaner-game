"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function IntroBriefing({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="mx-auto max-w-2xl">
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-cyan">
        Mission Briefing · January 2025
      </p>
      <h1 className="font-display text-4xl font-semibold">Welcome to Verdana County</h1>
      <Card className="mt-6 space-y-4 text-fog/90">
        <p>
          You are taking the helm of a county of <strong>100,000 residents</strong>.
          For a century it has run on fossil fuels. Its lights, cars, factories,
          and farms all add carbon to the sky.
        </p>
        <p>
          The world's atmosphere holds over <strong>432 ppm</strong> of CO₂ today, and
          rising. In our simulation, the count sits at <strong>430 ppm</strong> and
          climbs every month. If it reaches <strong>600 ppm</strong>, the county
          fails.
        </p>
        <p>
          Your mandate is simple to state and hard to do:{" "}
          <strong className="text-leaf">
            Reach net-zero aka Carbon Gain of 0.00 ppm/month or less before December
            2100
          </strong>{" "}
          without losing the public's trust.
        </p>
        <div className="rounded-xl border border-leaf/20 bg-leaf/5 p-4 text-sm">
          <p className="font-semibold text-leaf">Watch your gauges:</p>
          <ul className="mt-2 space-y-1 text-mist">
            <li>• <strong className="text-fog">Carbon Gain/Month</strong>: Drive it to zero. This is how you win.</li>
            <li>• <strong className="text-fog">Current Carbon</strong>: Keep it under 600 ppm.</li>
            <li>• <strong className="text-fog">Support</strong>: Below 50% you can't pass bills; below 30% residents fight back.</li>
            <li>• <strong className="text-fog">Budget</strong>: Every clean project costs money. Spend wisely.</li>
          </ul>
        </div>
      </Card>
      <div className="mt-6 flex justify-end">
        <Button size="lg" onClick={onContinue}>
          Choose your role →
        </Button>
      </div>
    </div>
  );
}
