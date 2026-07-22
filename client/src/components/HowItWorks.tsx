/**
 * EatVera HowItWorks Component
 * Design: Bold Brutalist Health — clear, direct steps
 */
import { Camera, Zap, Shield } from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: Camera,
    title: "Scan the Barcode",
    desc: "Point your camera at any grocery product barcode. Works on all UPC/EAN barcodes.",
    color: "#A8FF3E",
  },
  {
    number: "02",
    icon: Zap,
    title: "Instant Analysis",
    desc: "We check 50+ harmful ingredients including seed oils, artificial additives, and HFCS.",
    color: "#F4A825",
  },
  {
    number: "03",
    icon: Shield,
    title: "Get Your Score",
    desc: "Receive a 1-100 quality score with detailed breakdown of every flagged ingredient.",
    color: "#7BC67E",
  },
];

export default function HowItWorks() {
  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-white/8" />
        <span className="font-mono-data text-[10px] text-white/30 tracking-widest">HOW IT WORKS</span>
        <div className="h-px flex-1 bg-white/8" />
      </div>
      <div className="space-y-3">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="flex items-start gap-4 bg-[#161B22] rounded p-4 border border-white/6 slide-up opacity-0"
            style={{ animationDelay: `${i * 0.15}s`, animationFillMode: "forwards" }}
          >
            <div
              className="font-mono-data text-3xl font-bold leading-none flex-shrink-0"
              style={{ color: `${step.color}30` }}
            >
              {step.number}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <step.icon size={14} style={{ color: step.color }} />
                <h3 className="font-semibold text-white text-sm">{step.title}</h3>
              </div>
              <p className="text-xs text-white/55 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
