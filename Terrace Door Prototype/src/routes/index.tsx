import { createFileRoute } from "@tanstack/react-router";
import { Heart, Lock, Unlock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Access — Your Doors" },
      { name: "description", content: "Swipe to unlock your doors." },
    ],
  }),
  component: AccessScreen,
});

type Door = { id: string; name: string; favorite: boolean };

const INITIAL_DOORS: Door[] = [
  { id: "terrace", name: "Terrace", favorite: true },
  { id: "building", name: "Building entry", favorite: false },
  { id: "garage", name: "Garage", favorite: false },
];

function AccessScreen() {
  const [doors, setDoors] = useState(INITIAL_DOORS);

  const toggleFav = (id: string) =>
    setDoors((d) => d.map((x) => (x.id === id ? { ...x, favorite: !x.favorite } : x)));

  return (
    <div className="flex min-h-screen items-start justify-center bg-neutral-100 p-4">
      <div className="mx-auto flex min-h-[844px] w-[390px] flex-col bg-white">
        {/* content */}
        <div className="flex-1 px-5 pt-8">
          <p className="mb-3 text-xs font-semibold tracking-widest text-neutral-400">YOUR DOORS</p>
          <div className="flex flex-col gap-4 pb-8">
            {doors.map((door) => (
              <DoorCard key={door.id} door={door} onToggleFav={() => toggleFav(door.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DoorCard({ door, onToggleFav }: { door: Door; onToggleFav: () => void }) {
  const [unlocked, setUnlocked] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const KNOB = 56;

  const maxDrag = () => (trackRef.current?.offsetWidth ?? 280) - KNOB - 4;

  const onDown = (clientX: number) => {
    if (unlocked) return;
    setDragging(true);
    startX.current = clientX - dragX;
  };
  const onMove = (clientX: number) => {
    if (!dragging) return;
    const x = Math.max(0, Math.min(maxDrag(), clientX - startX.current));
    setDragX(x);
  };
  const onUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (dragX >= maxDrag() - 6) {
      setDragX(maxDrag());
      setUnlocked(true);
      setCountdown(5);
    } else {
      setDragX(0);
    }
  };

  useEffect(() => {
    if (!dragging) return;
    const m = (e: MouseEvent) => onMove(e.clientX);
    const u = () => onUp();
    window.addEventListener("mousemove", m);
    window.addEventListener("mouseup", u);
    return () => {
      window.removeEventListener("mousemove", m);
      window.removeEventListener("mouseup", u);
    };
  });

  useEffect(() => {
    if (!unlocked) return;
    if (countdown <= 0) {
      setUnlocked(false);
      setDragX(0);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [unlocked, countdown]);

  const pct = maxDrag() ? dragX / maxDrag() : 0;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-black">{door.name}</h2>
        <button onClick={onToggleFav} aria-label="favorite">
          <Heart
            className={`h-7 w-7 transition ${
              door.favorite ? "fill-red-500 text-red-500" : "text-black"
            }`}
          />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div
          ref={trackRef}
          className="relative h-14 flex-1 overflow-hidden rounded-full bg-neutral-100 select-none"
        >
          {unlocked ? (
            <div className="absolute inset-0 flex items-center justify-between rounded-full bg-gradient-to-r from-green-400 to-green-500 px-5 text-white">
              <div className="flex items-center gap-3">
                <Unlock className="h-5 w-5" />
                <span className="text-base font-medium">Door opened</span>
              </div>
              <span className="text-sm font-medium opacity-90">{countdown}</span>
            </div>
          ) : (
            <>
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-black to-neutral-700"
                style={{
                  width: `${dragX + KNOB}px`,
                  transition: dragging ? "none" : "width 300ms ease",
                }}
              />
              <div
                className="absolute inset-0 flex items-center justify-center gap-2 text-base font-medium text-neutral-700"
                style={{ opacity: 1 - pct }}
              >
                <span>Swipe to unlock</span>
                <span className="text-neutral-400">›››</span>
              </div>
              <div
                role="slider"
                aria-label={`Swipe to unlock ${door.name}`}
                onMouseDown={(e) => onDown(e.clientX)}
                onTouchStart={(e) => onDown(e.touches[0].clientX)}
                onTouchMove={(e) => onMove(e.touches[0].clientX)}
                onTouchEnd={onUp}
                className="absolute top-1/2 flex h-[52px] w-[52px] -translate-y-1/2 cursor-grab items-center justify-center rounded-full bg-black shadow-md active:cursor-grabbing"
                style={{
                  left: `${dragX + 2}px`,
                  transition: dragging ? "none" : "left 300ms ease",
                }}
              >
                <Lock className="h-5 w-5 text-white" />
              </div>
            </>
          )}
          </div>
        </div>
    </div>
  );
}
