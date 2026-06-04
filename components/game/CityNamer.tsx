"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// Large word lists; results from wheel A + wheel B combine into a city name.
const WHEEL_A = [
  "New", "Port", "Mount", "Lake", "North", "South", "East", "West", "Green",
  "Silver", "Cedar", "Maple", "Stone", "River", "Fair", "Bright", "Clear",
  "Sun", "Moon", "Pine", "Oak", "Willow", "Spring", "Summer", "Golden",
  "Crystal", "Haven", "Brook", "Glen", "Vale", "Ridge", "Hill",
];

const WHEEL_B = [
  "haven", "vale", "ridge", "shire", "field", "wood", "ford", "bridge",
  "port", "ton", "ville", "burg", "dale", "mont", "crest", "brook",
  "grove", "stead", "wick", "march", "moor", "cliff", "bay", "cove",
  "spring", "falls", "glen", "harbor", "meadow", "hollow", "reach", "point",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function Wheel({
  word,
  spinning,
  label,
}: {
  word: string;
  spinning: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <span className="mb-2 text-[10px] uppercase tracking-widest text-mist">{label}</span>
      <div className="glass flex h-24 w-40 items-center justify-center overflow-hidden rounded-2xl">
        <span
          className={`font-display text-2xl font-semibold text-leaf transition-all ${
            spinning ? "blur-sm opacity-60" : ""
          }`}
        >
          {word}
        </span>
      </div>
    </div>
  );
}

export function CityNamer({ onConfirm }: { onConfirm: (name: string) => void }) {
  const [a, setA] = useState(WHEEL_A[0]);
  const [b, setB] = useState(WHEEL_B[0]);
  const [spinning, setSpinning] = useState(false);
  const [hasSpun, setHasSpun] = useState(false);

  const name = `${a}${b}`;

  const spin = () => {
    setSpinning(true);
    setHasSpun(true);
    let ticks = 0;
    const interval = setInterval(() => {
      setA(pick(WHEEL_A));
      setB(pick(WHEEL_B));
      ticks++;
      if (ticks > 14) {
        clearInterval(interval);
        setSpinning(false);
      }
    }, 70);
  };

  return (
    <div className="mx-auto max-w-xl text-center">
      <h1 className="font-display text-4xl font-semibold">Name your city</h1>
      <p className="mt-3 text-mist">
        Spin the two wheels until you find a name you love. No typing — let fate
        (and good word lists) decide.
      </p>

      <Card className="mt-8">
        <div className="flex items-center justify-center gap-4">
          <Wheel word={a} spinning={spinning} label="Wheel A" />
          <span className="font-display text-3xl text-mist">+</span>
          <Wheel word={b} spinning={spinning} label="Wheel B" />
        </div>

        <div className="mt-8">
          <p className="text-xs uppercase tracking-widest text-mist">Your city</p>
          <p className="mt-1 font-display text-3xl font-semibold text-leaf">{name}</p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button variant="secondary" onClick={spin} disabled={spinning}>
            {hasSpun ? "🎲 Spin again" : "🎲 Spin the wheels"}
          </Button>
          <Button onClick={() => onConfirm(name)} disabled={spinning}>
            Found {name} →
          </Button>
        </div>
      </Card>
    </div>
  );
}
