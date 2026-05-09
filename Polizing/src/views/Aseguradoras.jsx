/* Polizing — Aseguradoras */

const AseguradoraFormModal = ({ open, onClose, onSave }) => {
  const [form, setForm] = useState({ razonSocial: "", cuit: "", contacto: "", email: "", telefono: "", direccion: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <UI.Modal
      open={open} onClose={onClose}
      title="Registrar aseguradora"
      subtitle="Datos de la entidad aseguradora con la que operás."
      maxWidth={620}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={() => onSave(form)}><I.Check size={14}/>Crear aseguradora</button>
      </>}
    >
      <div className="form-grid">
        <div className="form-section-label">Identificación</div>
        <UI.Field label="Razón social" required span2>
          <input className="input" value={form.razonSocial} onChange={(e) => set("razonSocial", e.target.value)} placeholder="Aseguradora del Plata S.A."/>
        </UI.Field>
        <UI.Field label="CUIT" required>
          <input className="input mono" value={form.cuit} onChange={(e) => set("cuit", e.target.value)} placeholder="30-50001234-1"/>
        </UI.Field>
        <UI.Field label="Persona de contacto">
          <input className="input" value={form.contacto} onChange={(e) => set("contacto", e.target.value)} placeholder="Nombre apellido"/>
        </UI.Field>
        <div className="form-section-label">Contacto</div>
        <UI.Field label="Email">
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="[email protected]"/>
        </UI.Field>
        <UI.Field label="Teléfono">
          <input className="input mono" value={form.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="+54 11 ..."/>
        </UI.Field>
        <UI.Field label="Dirección" span2>
          <input className="input" value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle 123, Ciudad"/>
        </UI.Field>
      </div>
    </UI.Modal>
  );
};

const AseguradorasView = ({ onNavigate }) => {
  const D = window.PolData;
  const [modal, setModal] = useState(false);

  const totalPolizas = D.POLIZAS.filter(p => p.estado !== "anulada" && p.estado !== "vencida").length || 1;

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Aseguradoras</h1>
          <p className="page-subtitle">{D.ASEGURADORAS.length} compañías aseguradoras registradas</p>
        </div>
        <div className="page-actions">
          <button className="btn primary" onClick={() => setModal(true)}><I.Plus size={14}/>Nueva aseguradora</button>
        </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--gap)", marginBottom: "var(--gap)"}}>
        {D.ASEGURADORAS.map(a => {
          const polizas = D.POLIZAS.filter(p => p.aseguradoraId === a.id);
          const activas = polizas.filter(p => p.estado === "vigente" || p.estado === "proxima").length;
          const prima = polizas.filter(p => p.estado !== "anulada" && p.estado !== "vencida").reduce((s,p) => s + p.prima, 0);
          const pct = (activas / totalPolizas) * 100;
          return (
            <div key={a.id} className="card" style={{cursor: "pointer"}}>
              <div style={{padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12}}>
                <div style={{
                  width: 44, height: 44, borderRadius: 9,
                  background: `${a.color}15`, color: a.color,
                  display: "grid", placeItems: "center",
                  fontWeight: 700, fontSize: 14, letterSpacing: -0.02,
                  border: `1px solid ${a.color}30`,
                }}>
                  {a.razonSocial.split(" ").filter(w => w.length > 2).slice(0,2).map(w => w[0]).join("")}
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontWeight: 600, fontSize: 14, lineHeight: 1.25}}>{a.razonSocial}</div>
                  <div className="mono" style={{fontSize: 12, color: "var(--muted)", marginTop: 2}}>{a.cuit}</div>
                </div>
                <button className="btn ghost icon sm" onClick={(e) => e.stopPropagation()}><I.More size={14}/></button>
              </div>
              <div className="card-pad" style={{display: "flex", flexDirection: "column", gap: 10}}>
                <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fg-2)"}}>
                  <I.User size={13} style={{color: "var(--muted)"}}/>{a.contacto}
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fg-2)"}}>
                  <I.Mail size={13} style={{color: "var(--muted)"}}/>{a.email}
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--fg-2)"}}>
                  <I.Phone size={13} style={{color: "var(--muted)"}}/><span className="mono">{a.telefono}</span>
                </div>

                <div style={{height: 1, background: "var(--border)", margin: "6px 0"}}></div>

                <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8}}>
                  <div>
                    <div style={{fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Pólizas activas</div>
                    <div className="mono" style={{fontSize: 18, fontWeight: 600, marginTop: 2}}>{activas}</div>
                  </div>
                  <div>
                    <div style={{fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Prima mensual</div>
                    <div className="mono" style={{fontSize: 14, fontWeight: 600, marginTop: 2}}>{D.fmtAR(prima)}</div>
                  </div>
                </div>
                <div style={{height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden", marginTop: 4}}>
                  <div style={{height: "100%", width: `${pct}%`, background: a.color, borderRadius: 3}}></div>
                </div>
                <div style={{fontSize: 11, color: "var(--muted)"}}>{pct.toFixed(0)}% de la cartera</div>
              </div>
            </div>
          );
        })}
      </div>

      <AseguradoraFormModal open={modal} onClose={() => setModal(false)} onSave={() => setModal(false)}/>
    </>
  );
};

window.AseguradorasView = AseguradorasView;
