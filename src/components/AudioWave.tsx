interface AudioWaveProps {
  active: boolean;
  bars?: number;
  color?: string;
}

const DELAYS = ["0ms", "120ms", "240ms", "120ms", "0ms", "120ms", "240ms", "120ms", "0ms"];

export function AudioWave({ active, bars = 9, color = "#14b8a6" }: AudioWaveProps) {
  return (
    <div className="flex items-center gap-[3px] h-6" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full wave-bar"
          style={{
            height: active ? "100%" : "30%",
            backgroundColor: color,
            animationDelay: DELAYS[i % DELAYS.length],
            animationPlayState: active ? "running" : "paused",
            transition: "height 0.25s ease",
          }}
        />
      ))}
    </div>
  );
}
