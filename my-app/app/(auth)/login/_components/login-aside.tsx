export function LoginAside() {
  return (
    <aside className="relative overflow-hidden flex flex-col justify-between p-14 text-[#e7ecf3] bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(255,255,255,0.08),transparent_60%),radial-gradient(800px_600px_at_110%_110%,rgba(120,180,255,0.12),transparent_50%),linear-gradient(155deg,#0c2140_0%,#0f2744_35%,#163659_100%)]">
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_30%,transparent_80%)]"
      />

      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 rounded-[10px] grid place-items-center text-white font-bold text-base bg-[linear-gradient(135deg,#4a82d9_0%,#2a5a93_60%,#1e3a5f_100%)] shadow-[inset_0_-3px_0_rgba(0,0,0,0.18),0_4px_12px_rgba(0,0,0,0.3)]">
          P
        </div>
        <div>
          <small className="block text-[11px] opacity-60 tracking-[0.08em] uppercase">
            Software
          </small>
          <b className="text-[18px] tracking-[-0.015em]">Polizing</b>
        </div>
      </div>

      <div className="relative max-w-[480px]">
        <h1 className="text-[38px] font-semibold tracking-[-0.025em] leading-[1.12] mb-4">
          Gestión centralizada para tu productora de seguros.
        </h1>
        <p className="text-[15px] leading-[1.55] opacity-80 mb-7">
          Pólizas, clientes, aseguradoras y siniestros — en un solo panel. Reportes
          vía WhatsApp procesados con IA, validación de pagos masivos y alertas de
          vencimientos automatizadas.
        </p>
        <div className="grid grid-cols-3 gap-6 border-t border-white/10 pt-6">
          <Stat value="1.284" label="Pólizas activas" />
          <Stat value="24/7" label="Reportes WhatsApp" />
          <Stat value="99,8%" label="Disponibilidad" />
        </div>
      </div>

      <div className="relative text-xs opacity-55">
        © 2026 Polizing · v2.4.1 · Sólo personal autorizado
      </div>
    </aside>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <b className="font-mono text-[22px] font-semibold block tracking-[-0.01em]">
        {value}
      </b>
      <small className="text-[11.5px] opacity-65 tracking-[0.04em] uppercase">
        {label}
      </small>
    </div>
  );
}
