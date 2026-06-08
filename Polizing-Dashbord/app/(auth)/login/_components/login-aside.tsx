import Image from "next/image";

export function LoginAside() {
  return (
    <aside className="hidden lg:flex relative overflow-hidden flex-col justify-between p-14 text-[#e7ecf3] bg-[radial-gradient(1200px_600px_at_-10%_-20%,rgba(255,255,255,0.08),transparent_60%),radial-gradient(800px_600px_at_110%_110%,rgba(120,180,255,0.12),transparent_50%),linear-gradient(155deg,#0c2140_0%,#0f2744_35%,#163659_100%)]">
      <div
        aria-hidden
        className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,#000_30%,transparent_80%)]"
      />

      <div className="relative">
        <Image
          src="/logo-horizontal.png"
          alt="Polizing"
          width={200}
          height={40}
          className="object-contain h-10 w-auto brightness-0 invert opacity-90"
          priority
        />
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
