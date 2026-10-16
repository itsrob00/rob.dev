"use client";

import { useSyncExternalStore } from "react";
import { formatGaetaTime } from "@/lib/clock";

// Only minutes are shown, so a 1s tick re-renders just once a minute: React skips unchanged snapshots.
function subscribe(onTick: () => void) {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

const getTime = () => formatGaetaTime(new Date());

// The page is prerendered at build time, so the server can't know the time. The client fills it in.
const getServerTime = () => null;

export function GaetaClock() {
  const time = useSyncExternalStore(subscribe, getTime, getServerTime);

  return <p>{time ?? "--:--"} in Gaeta</p>;
}
