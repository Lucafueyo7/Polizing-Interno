import { Sparkles } from "@/components/icons";

export function AiSummary({ summary }: { summary: string | null }) {
  if (!summary) return null;
  return (
    <section className="rounded-lg border border-brand-info/20 bg-brand-info-soft px-4 py-3.5 flex gap-3">
      <span
        className="w-7 h-7 rounded-md grid place-items-center bg-brand-info text-white shrink-0"
        aria-hidden="true"
      >
        <Sparkles className="w-3.5 h-3.5" />
      </span>
      <div className="text-[13px] text-brand-fg-2 leading-relaxed">
        <b className="text-foreground block mb-0.5">
          Resumen IA · clasificación automática
        </b>
        {summary}
      </div>
    </section>
  );
}
