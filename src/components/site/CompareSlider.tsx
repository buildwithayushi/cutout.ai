import { useRef, useState, useCallback, useEffect } from "react";
import { GripVertical } from "lucide-react";

const checker =
  "conic-gradient(oklch(0.85 0 0) 0 25%, oklch(0.95 0 0) 0 50%, oklch(0.85 0 0) 0 75%, oklch(0.95 0 0) 0 100%) 0 0 / 20px 20px";

export function CompareSlider({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const onMove = useCallback((clientX: number) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const p = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, p)));
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      onMove(x);
    };
    const up = () => (dragging.current = false);
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [onMove]);

  return (
    <div
      ref={ref}
      className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl select-none"
      style={{ background: checker }}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pos)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
        if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
      }}
    >
      <img src={after} alt="Processed" className="absolute inset-0 h-full w-full object-contain" />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <img
          src={before}
          alt="Original"
          className="absolute inset-0 h-full object-contain"
          style={{ width: `${(100 / pos) * 100}%`, maxWidth: "none" }}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-glow"
        style={{ left: `${pos}%` }}
      >
        <button
          type="button"
          onMouseDown={() => (dragging.current = true)}
          onTouchStart={() => (dragging.current = true)}
          className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full bg-white text-foreground shadow-glow"
          aria-label="Drag to compare"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        Before
      </span>
      <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
        After
      </span>
    </div>
  );
}