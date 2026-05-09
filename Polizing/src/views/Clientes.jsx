/* Polizing — Clientes (listado, detalle, modal ABM) */

const ClienteFormModal = ({ open, onClose, onSave, initial }) => {
  const empty = { tipo: "normal", nombre: "", apellido: "", dni: "", razonSocial: "", cuit: "", contactoNombre: "", email: "", telefono: "", direccion: "", estado: "activo" };
  const [form, setForm] = useState(initial || empty);
  useEffect(() => { setForm(initial || empty); }, [initial, open]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const isCorp = form.tipo === "corp";

  return (
    <UI.Modal
      open={open}
      onClose={onClose}
      title={initial ? "Editar cliente" : "Registrar cliente"}
      subtitle="Los campos varían según el tipo de cliente."
      maxWidth={680}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn primary" onClick={() => onSave(form)}>
          <I.Check size={14}/>{initial ? "Guardar cambios" : "Crear cliente"}
        </button>
      </>}
    >
      <div className="form-grid">
        <div className="span-2">
          <label style={{fontSize: 12.5, fontWeight: 500, display: "block", marginBottom: 8, color: "var(--fg-2)"}}>Tipo de cliente <span className="req">*</span></label>
          <div style={{display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10}}>
            {[
              {v:"normal", label:"Particular", desc:"Persona física · DNI", icon: I.User},
              {v:"corp",   label:"Corporativo", desc:"Persona jurídica · CUIT", icon: I.Building},
            ].map(o => {
              const Icn = o.icon;
              const sel = form.tipo === o.v;
              return (
                <button key={o.v} type="button"
                  onClick={() => set("tipo", o.v)}
                  style={{
                    padding: "12px 14px", border: `1px solid ${sel ? "var(--primary)" : "var(--border)"}`,
                    background: sel ? "var(--primary-soft)" : "var(--surface)",
                    borderRadius: 9, display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                    cursor: "pointer",
                  }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 7,
                    display: "grid", placeItems: "center",
                    background: sel ? "var(--primary)" : "var(--surface-hover)",
                    color: sel ? "#fff" : "var(--muted)",
                  }}><Icn size={16}/></div>
                  <div>
                    <b style={{fontSize: 13, color: sel ? "var(--primary)" : "var(--fg)", display: "block"}}>{o.label}</b>
                    <small style={{fontSize: 11.5, color: "var(--muted)"}}>{o.desc}</small>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-section-label">Datos {isCorp ? "de la empresa" : "personales"}</div>

        {!isCorp && <>
          <UI.Field label="Nombre" required>
            <input className="input" value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Juan"/>
          </UI.Field>
          <UI.Field label="Apellido" required>
            <input className="input" value={form.apellido} onChange={(e) => set("apellido", e.target.value)} placeholder="Pérez"/>
          </UI.Field>
          <UI.Field label="DNI" required>
            <input className="input mono" value={form.dni} onChange={(e) => set("dni", e.target.value)} placeholder="33.123.456"/>
          </UI.Field>
          <UI.Field label="Estado" required>
            <select className="select" value={form.estado} onChange={(e) => set("estado", e.target.value)}>
              <option value="activo">Activo</option>
              <option value="baja">Baja</option>
            </select>
          </UI.Field>
        </>}

        {isCorp && <>
          <UI.Field label="Razón social" required span2>
            <input className="input" value={form.razonSocial} onChange={(e) => set("razonSocial", e.target.value)} placeholder="Constructora Andina S.A."/>
          </UI.Field>
          <UI.Field label="CUIT" required>
            <input className="input mono" value={form.cuit} onChange={(e) => set("cuit", e.target.value)} placeholder="30-71045892-7"/>
          </UI.Field>
          <UI.Field label="Persona de contacto">
            <input className="input" value={form.contactoNombre} onChange={(e) => set("contactoNombre", e.target.value)} placeholder="Mariano Pereyra"/>
          </UI.Field>
        </>}

        <div className="form-section-label">Contacto</div>
        <UI.Field label="Email" required>
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

const ClienteDetail = ({ cliente, onBack, onEdit, onNavigate }) => {
  const D = window.PolData;
  const polizas = D.POLIZAS.filter(p => p.clienteId === cliente.id);
  const siniestros = D.SINIESTROS.filter(s => s.clienteId === cliente.id);
  const [tab, setTab] = useState("contrataciones");

  const totalAnual = polizas.filter(p => p.estado !== "anulada" && p.estado !== "vencida").reduce((s,p) => s + p.prima * 12, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 8}}>
            <button className="btn ghost sm" onClick={onBack}><I.ChevronLeft size={14}/>Clientes</button>
          </div>
          <div style={{display: "flex", alignItems: "center", gap: 16}}>
            <UI.ClienteAvatar cliente={cliente} size={48}/>
            <div>
              <h1 className="page-title">{D.clienteLabel(cliente)}</h1>
              <div style={{display: "flex", gap: 8, marginTop: 6, alignItems: "center"}}>
                <UI.ClienteBadge tipo={cliente.tipo}/>
                <UI.EstadoClienteBadge estado={cliente.estado}/>
                <span style={{color: "var(--muted)", fontSize: 13}} className="mono">{D.clienteIdent(cliente)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Mail size={14}/>Email</button>
          <button className="btn"><I.WhatsApp size={14}/>WhatsApp</button>
          <button className="btn"><I.Edit size={14}/>Editar</button>
          <button className="btn primary" onClick={() => onNavigate("polizas", { newForCliente: cliente.id })}><I.Plus size={14}/>Nueva póliza</button>
        </div>
      </div>

      <div className="detail-grid">
        {/* Sidebar info */}
        <div style={{display: "flex", flexDirection: "column", gap: "var(--gap)"}}>
          <div className="card">
            <div className="card-head"><h3 className="card-title">Datos {cliente.tipo === "corp" ? "empresariales" : "personales"}</h3></div>
            <div className="card-pad" style={{paddingTop: 8, paddingBottom: 8}}>
              {cliente.tipo === "corp" ? (
                <>
                  <UI.KV k="Razón social" v={cliente.razonSocial}/>
                  <UI.KV k="CUIT" v={cliente.cuit} mono/>
                  <UI.KV k="Contacto" v={cliente.contactoNombre || "—"}/>
                </>
              ) : (
                <>
                  <UI.KV k="Nombre" v={`${cliente.nombre} ${cliente.apellido}`}/>
                  <UI.KV k="DNI" v={cliente.dni} mono/>
                </>
              )}
              <UI.KV k="Email" v={cliente.email}/>
              <UI.KV k="Teléfono" v={cliente.telefono} mono/>
              <UI.KV k="Dirección" v={cliente.direccion}/>
              <UI.KV k="Cliente desde" v={D.fmtDate(cliente.desde)}/>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3 className="card-title">Resumen</h3></div>
            <div className="card-pad" style={{display: "flex", flexDirection: "column", gap: 14}}>
              <div>
                <div style={{fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Pólizas activas</div>
                <div className="mono" style={{fontSize: 26, fontWeight: 600, marginTop: 2}}>{polizas.filter(p => p.estado === "vigente" || p.estado === "proxima").length}</div>
              </div>
              <div>
                <div style={{fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Prima anualizada</div>
                <div className="mono" style={{fontSize: 18, fontWeight: 600, marginTop: 2}}>{D.fmtAR(totalAnual)}</div>
              </div>
              <div>
                <div style={{fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Siniestros (12m)</div>
                <div className="mono" style={{fontSize: 18, fontWeight: 600, marginTop: 2}}>{siniestros.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main */}
        <div className="card">
          <UI.Tabs
            tabs={[
              { value: "contrataciones", label: "Contrataciones", count: polizas.length },
              { value: "siniestros", label: "Siniestros", count: siniestros.length },
              { value: "actividad", label: "Actividad" },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === "contrataciones" && (
            <div className="table-wrap">
              {polizas.length === 0 ? (
                <UI.Empty icon={I.Shield} title="Sin contrataciones" subtitle="Este cliente aún no tiene pólizas asociadas."/>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Póliza</th>
                      <th>Tipo / Cobertura</th>
                      <th>Aseguradora</th>
                      <th>Vigencia</th>
                      <th className="num">Suma asegurada</th>
                      <th className="num">Prima mensual</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {polizas.map(p => {
                      const a = D.findAseguradora(p.aseguradoraId);
                      return (
                        <tr key={p.id} onClick={() => onNavigate("polizas", { polizaId: p.id })}>
                          <td className="cell-strong mono">{p.numero}</td>
                          <td>
                            <div className="cell-stack">
                              <span style={{fontWeight: 500}}>{p.tipo}</span>
                              <small>{p.cobertura}</small>
                            </div>
                          </td>
                          <td>{a.razonSocial}</td>
                          <td><span className="mono cell-muted">{D.fmtDate(p.inicio)} → {D.fmtDate(p.fin)}</span></td>
                          <td className="num mono">{p.suma ? D.fmtAR(p.suma) : "—"}</td>
                          <td className="num mono cell-strong">{D.fmtAR(p.prima)}</td>
                          <td><UI.PolizaBadge estado={p.estado}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "siniestros" && (
            <div className="table-wrap">
              {siniestros.length === 0 ? (
                <UI.Empty icon={I.Alert} title="Sin siniestros" subtitle="Este cliente no tiene siniestros reportados."/>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Póliza</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siniestros.map(s => {
                      const p = D.findPoliza(s.polizaId);
                      return (
                        <tr key={s.id} onClick={() => onNavigate("siniestros", { siniestroId: s.id })}>
                          <td className="mono cell-strong">{s.numero}</td>
                          <td className="mono cell-muted">{D.fmtDate(s.fecha)}</td>
                          <td>{s.titulo}</td>
                          <td className="mono cell-muted">{p?.numero}</td>
                          <td><UI.SinBadge estado={s.estado}/></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "actividad" && (
            <div style={{padding: 24}}>
              <UI.Empty icon={I.Clock} title="Historial de actividad" subtitle="Próximamente."/>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

const ClientesView = ({ onNavigate, focusClienteId, clearFocus }) => {
  const D = window.PolData;
  const [search, setSearch] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [estado, setEstado] = useState("todos");
  const [modal, setModal] = useState(null); // null | "create" | { mode: "edit", cliente }
  const [selected, setSelected] = useState(focusClienteId || null);

  useEffect(() => {
    if (focusClienteId) { setSelected(focusClienteId); clearFocus && clearFocus(); }
  }, [focusClienteId]);

  const filtered = D.CLIENTES.filter(c => {
    if (tipo !== "todos" && c.tipo !== tipo) return false;
    if (estado !== "todos" && c.estado !== estado) return false;
    if (search) {
      const q = search.toLowerCase();
      const lbl = D.clienteLabel(c).toLowerCase();
      const id = D.clienteIdent(c).toLowerCase();
      if (!lbl.includes(q) && !id.includes(q) && !c.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (selected) {
    const c = D.findCliente(selected);
    if (c) return <ClienteDetail cliente={c} onBack={() => setSelected(null)} onEdit={() => setModal({ mode: "edit", cliente: c })} onNavigate={onNavigate}/>;
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{D.fmtNum(D.CLIENTES.length)} clientes registrados · {D.fmtNum(D.CLIENTES.filter(c => c.tipo === "corp").length)} corporativos · {D.fmtNum(D.CLIENTES.filter(c => c.tipo === "normal").length)} particulares</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={14}/>Exportar</button>
          <button className="btn primary" onClick={() => setModal("create")}><I.Plus size={14}/>Nuevo cliente</button>
        </div>
      </div>

      <div className="card">
        <div className="card-pad" style={{paddingBottom: 12}}>
          <div className="filterbar">
            <div className="input-with-icon" style={{flex: 1, maxWidth: 360}}>
              <I.Search size={15}/>
              <input className="input" placeholder="Buscar por nombre, DNI, CUIT, email..." value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
            <UI.Segmented
              options={[{label:"Todos", value:"todos"}, {label:"Particulares", value:"normal"}, {label:"Corporativos", value:"corp"}]}
              value={tipo} onChange={setTipo}
            />
            <select className="select" style={{width: 140}} value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="todos">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="baja">De baja</option>
            </select>
            <div className="spacer"></div>
            <button className="btn"><I.Filter size={14}/>Más filtros</button>
          </div>
        </div>
        <div className="table-wrap" style={{borderTop: "1px solid var(--border)"}}>
          <table className="table">
            <thead>
              <tr>
                <th style={{width: 32}}><input type="checkbox" style={{accentColor: "var(--primary)"}}/></th>
                <th>Cliente</th>
                <th>Identificación</th>
                <th>Contacto</th>
                <th className="num">Pólizas</th>
                <th className="num">Prima mensual</th>
                <th>Estado</th>
                <th style={{width: 40}}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c.id)}>
                  <td onClick={(e) => e.stopPropagation()}><input type="checkbox" style={{accentColor: "var(--primary)"}}/></td>
                  <td>
                    <div className="cell-with-avatar">
                      <UI.ClienteAvatar cliente={c}/>
                      <div className="cell-stack">
                        <span className="cell-strong">{D.clienteLabel(c)}</span>
                        <small>{c.tipo === "corp" ? c.contactoNombre || "—" : `Cliente desde ${D.fmtDate(c.desde).slice(3)}`}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="cell-stack">
                      <span className="mono">{D.clienteIdent(c)}</span>
                      <small><UI.ClienteBadge tipo={c.tipo}/></small>
                    </div>
                  </td>
                  <td>
                    <div className="cell-stack">
                      <span style={{fontSize: 12.5}}>{c.email}</span>
                      <small className="mono">{c.telefono}</small>
                    </div>
                  </td>
                  <td className="num mono cell-strong">{c.polizasActivas}</td>
                  <td className="num mono">{c.montoMensual ? D.fmtAR(c.montoMensual) : "—"}</td>
                  <td><UI.EstadoClienteBadge estado={c.estado}/></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button className="btn ghost icon sm"><I.More size={14}/></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="8"><UI.Empty icon={I.Search} title="Sin resultados" subtitle="Probá ajustar los filtros."/></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-foot">
          <span>Mostrando <b style={{color: "var(--fg)"}}>{filtered.length}</b> de {D.CLIENTES.length}</span>
          <div className="row" style={{gap: 4}}>
            <button className="btn ghost icon sm" disabled><I.ChevronLeft size={14}/></button>
            <span className="mono" style={{fontSize: 12.5, padding: "0 8px"}}>Página 1 de 1</span>
            <button className="btn ghost icon sm" disabled><I.ChevronRight size={14}/></button>
          </div>
        </div>
      </div>

      <ClienteFormModal
        open={modal === "create" || modal?.mode === "edit"}
        initial={modal?.mode === "edit" ? modal.cliente : null}
        onClose={() => setModal(null)}
        onSave={() => setModal(null)}
      />
    </>
  );
};

window.ClientesView = ClientesView;
