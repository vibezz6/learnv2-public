import { useEffect, useRef } from "react";

const PHI = 1.61803398875;

interface Props {
  completed: number;
  total: number;
}

export function GoldenRatioProgress({ completed, total }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 120;
    canvas.width = size;
    canvas.height = size;
    const center = size / 2;
    const radius = size / 2 - 12;
    ctx.clearRect(0, 0, size, size);

    const progress = total > 0 ? completed / total : 0;
    ctx.beginPath();
    ctx.arc(center, center, radius, -Math.PI / 2, -Math.PI / 2 + progress * 2 * Math.PI);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#d97757";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-heading").trim() || "#f5f4f1";
    ctx.font = "bold 28px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("φ", center, center - 6);

    ctx.font = "10px sans-serif";
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--text-muted").trim() || "#8b8999";
    ctx.fillText(PHI.toFixed(3), center, center + 18);
  }, [completed, total]);

  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-xs font-medium text-[var(--text-muted)]">Golden ratio</div>
      <canvas ref={canvasRef} className="h-[120px] w-[120px]" />
      <div className="text-[10px] text-[var(--text-muted)]">
        {completed}/{total}
      </div>
    </div>
  );
}
