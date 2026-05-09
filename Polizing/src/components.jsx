/* Polizing — Shared UI primitives */

const { useState, useEffect, useMemo, useRef, useCallback } = React;

// ============= Status badges =============
const POLIZA_STATUS = {
  vigente:  { label: "Vigente",       cls: "vigente"  },
  proxima:  { label: "Próx. a vencer",cls: "proxima"  },
  vencida:  { label: "Vencida",       cls: "vencida"  },
  anulada:  { label: "Anulada",       cls: "anulada"  },
  renovada: { label: "Renovada",      cls: "renovada" },
};

const SIN_STATUS = {
  nuevo:   { label: "Nuevo",      cls: "nuevo" },
  tramite: { label: "En trámite", cls: "tramite" },
  cerrado: { label: "Cerrado",    cls: "cerrado" },
};

const PolizaBadge = ({ estado }) => {
  const s = POLIZA_STATUS[estado] || POLIZA_STATUS.vigente;
  return <span className={`badge ${s.cls}`}><span className="dot"></span>{s.label}</span>;
};

const SinBadge = ({ estado }) => {
  const s = SIN_STATUS[estado] || SIN_STATUS.nuevo;
  return <span className={`badge ${s.cls}`}><span className="dot"></span>{s.label}</span>;
};

const ClienteBadge = ({ tipo }) => (
  <span className={`badge ${tipo === "corp" ? "corp" : "normal"}`}>
    {tipo === "corp" ? "Corporativo" : "Particular"}
  </span>
);

const EstadoClienteBadge = ({ estado }) => (
  <span className={`badge ${estado === "activo" ? "activo" : "baja"}`}>
    <span className="dot"></span>{estado === "activo" ? "Activo" : "Baja"}
  </span>
);

// ============= Avatar =============
const ClienteAvatar = ({ cliente, size }) => {
  const letters = window.PolData.clienteAvatarLetters(cliente);
  const cls = cliente.tipo === "corp" ? "avatar-sm corp" : "avatar-sm";
  const style = size ? { width: size, height: size, fontSize: size * 0.4 } : {};
  return <span className={cls} style={style}>{letters}</span>;
};

// ============= Modal =============
const Modal = ({ open, onClose, title, subtitle, children, footer, maxWidth }) => {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose && onClose()}>
      <div className="modal" style={maxWidth ? { maxWidth } : undefined}>
        <div className="modal-head">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Cerrar"><I.X size={16}/></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
};

// ============= Empty state =============
const Empty = ({ icon: IconC = I.Inbox, title, subtitle }) => (
  <div className="empty">
    <IconC size={32}/>
    <div style={{fontWeight:600, color:"var(--fg-2)", marginTop: 4}}>{title}</div>
    {subtitle && <div style={{marginTop: 2}}>{subtitle}</div>}
  </div>
);

// ============= Sparkline (mini SVG line) =============
const Sparkline = ({ values = [], color = "var(--accent)", w = 80, h = 32 }) => {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = w / (values.length - 1);
  const pts = values.map((v, i) => `${i * step},${h - ((v - min) / range) * (h - 4) - 2}`).join(" ");
  const last = values.length - 1;
  return (
    <svg width={w} height={h} className="kpi-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={last * step} cy={h - ((values[last] - min) / range) * (h - 4) - 2} r="2" fill={color}/>
    </svg>
  );
};

// ============= Tabs =============
const Tabs = ({ tabs, value, onChange }) => (
  <div className="tabs">
    {tabs.map(t => (
      <button
        key={t.value}
        className="tab"
        data-active={value === t.value}
        onClick={() => onChange(t.value)}
      >
        {t.label}{t.count != null && <span style={{marginLeft: 6, fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: 11.5}}>{t.count}</span>}
      </button>
    ))}
  </div>
);

// ============= Segmented =============
const Segmented = ({ options, value, onChange }) => (
  <div className="seg">
    {options.map(o => (
      <button key={o.value} data-active={value === o.value} onClick={() => onChange(o.value)}>
        {o.label}
      </button>
    ))}
  </div>
);

// ============= Field =============
const Field = ({ label, required, hint, children, span2 }) => (
  <div className={`field ${span2 ? "span-2" : ""}`} style={span2 ? { gridColumn: "span 2" } : undefined}>
    {label && <label>{label}{required && <span className="req">*</span>}</label>}
    {children}
    {hint && <div className="hint">{hint}</div>}
  </div>
);

// ============= KV row =============
const KV = ({ k, v, mono }) => (
  <div className="kv">
    <b>{k}</b>
    <span className={mono ? "mono" : ""}>{v}</span>
  </div>
);

// ============= Time-ago helper =============
const timeAgo = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date(window.PolData.TODAY + "T20:00:00");
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  if (diffMin < 1440) return `hace ${Math.round(diffMin / 60)} h`;
  const dd = Math.round(diffMin / 1440);
  if (dd < 7) return `hace ${dd} d`;
  const [Y, M, D] = iso.split("T")[0].split("-");
  return `${D}/${M}`;
};

window.UI = {
  POLIZA_STATUS, SIN_STATUS,
  PolizaBadge, SinBadge, ClienteBadge, EstadoClienteBadge,
  ClienteAvatar, Modal, Empty, Sparkline, Tabs, Segmented, Field, KV, timeAgo,
};
