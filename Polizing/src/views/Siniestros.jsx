/* Polizing — Siniestros (bandeja de entrada + alta) */

const SiniestrosView = ({ onNavigate, focusSiniestroId, clearFocus }) => {
  const D = window.PolData;
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(focusSiniestroId || D.SINIESTROS[0]?.id);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (focusSiniestroId) { setSelected(focusSiniestroId); clearFocus && clearFocus(); }
  }, [focusSiniestroId]);

  if (creating) {
    return <NuevoSiniestroView onCancel={() => setCreating(false)} onCreate={() => setCreating(false)} onNavigate={onNavigate}/>;
  }

  const counts = {
    todos:   D.SINIESTROS.length,
    nuevo:   D.SINIESTROS.filter(s => s.estado === "nuevo").length,
    tramite: D.SINIESTROS.filter(s => s.estado === "tramite").length,
    cerrado: D.SINIESTROS.filter(s => s.estado === "cerrado").length,
  };

  const filtered = D.SINIESTROS.filter(s => {
    if (filter !== "todos" && s.estado !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const c = D.findCliente(s.clienteId);
      if (!s.titulo.toLowerCase().includes(q) && !D.clienteLabel(c).toLowerCase().includes(q) && !s.numero.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const current = D.SINIESTROS.find(s => s.id === selected) || filtered[0];

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Siniestros</h1>
          <p className="page-subtitle">Bandeja de entrada · {counts.nuevo} nuevos sin revisar · {counts.tramite} en trámite</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Refresh size={14}/>Sincronizar WhatsApp</button>
          <button className="btn primary" onClick={() => setCreating(true)}><I.Plus size={14}/>Nuevo siniestro</button>
        </div>
      </div>

      <div style={{padding: "0 0 16px"}}>
        <UI.Tabs
          tabs={[
            { value: "todos",   label: "Todos",      count: counts.todos },
            { value: "nuevo",   label: "Nuevos",     count: counts.nuevo },
            { value: "tramite", label: "En trámite", count: counts.tramite },
            { value: "cerrado", label: "Cerrados",   count: counts.cerrado },
          ]}
          value={filter} onChange={setFilter}
        />
      </div>

      <div className="inbox-grid">
        {/* List */}
        <div className="inbox-list">
          <div className="inbox-list-head">
            <div className="input-with-icon inbox-search">
              <I.Search size={14}/>
              <input className="input" style={{height: 34}} placeholder="Buscar siniestros..." value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
            <button className="btn ghost icon sm"><I.Sort size={14}/></button>
          </div>
          <div className="inbox-list-body">
            {filtered.length === 0 && <UI.Empty icon={I.Inbox} title="Sin siniestros" subtitle="No hay reportes que coincidan con el filtro."/>}
            {filtered.map(s => {
              const c = D.findCliente(s.clienteId);
              return (
                <div key={s.id}
                  className="inbox-item"
                  data-active={s.id === current?.id}
                  data-unread={!s.leido}
                  onClick={() => setSelected(s.id)}>
                  <div className="inbox-item-row1">
                    <UI.ClienteAvatar cliente={c} size={22}/>
                    <span className="inbox-item-from">{D.clienteLabel(c)}</span>
                    <span className="inbox-item-time">{UI.timeAgo(s.fechaReporte)}</span>
                  </div>
                  <div className="inbox-item-title">{s.titulo}</div>
                  <div className="inbox-item-snippet">{s.descripcion}</div>
                  <div className="inbox-item-row3">
                    <UI.SinBadge estado={s.estado}/>
                    {s.fuente === "whatsapp" && (
                      <span className="badge whatsapp" style={{padding: "2px 7px", fontSize: 10.5}}>
                        <I.WhatsApp size={11}/>WhatsApp
                      </span>
                    )}
                    <span style={{fontSize: 11, color: "var(--muted)", marginLeft: "auto", display: "flex", alignItems: "center", gap: 4}}>
                      <I.Paperclip size={11}/>{s.docs.length}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="inbox-detail">
          {!current ? (
            <UI.Empty icon={I.Inbox} title="Seleccioná un siniestro" subtitle="Elegí un caso de la lista para ver el detalle."/>
          ) : (
            <SinDetail siniestro={current} onNavigate={onNavigate}/>
          )}
        </div>
      </div>
    </>
  );
};

const SinDetail = ({ siniestro: s, onNavigate }) => {
  const D = window.PolData;
  const c = D.findCliente(s.clienteId);
  const p = D.findPoliza(s.polizaId);
  const a = D.findAseguradora(p?.aseguradoraId);

  return (
    <>
      <div className="inbox-detail-head">
        <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 12}}>
          <UI.SinBadge estado={s.estado}/>
          {s.fuente === "whatsapp" && (
            <span className="badge whatsapp" style={{padding: "2px 7px", fontSize: 10.5}}>
              <I.WhatsApp size={11}/>WhatsApp
            </span>
          )}
          <span className="mono" style={{fontSize: 12, color: "var(--muted)", marginLeft: "auto"}}>{s.numero}</span>
        </div>
        <h2 style={{margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: "-0.015em"}}>{s.titulo}</h2>
        <div style={{display: "flex", alignItems: "center", gap: 16, marginTop: 12, flexWrap: "wrap"}}>
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <UI.ClienteAvatar cliente={c} size={26}/>
            <div>
              <div style={{fontWeight: 500, fontSize: 13}}>{D.clienteLabel(c)}</div>
              <div className="mono" style={{fontSize: 11.5, color: "var(--muted)"}}>{D.clienteIdent(c)}</div>
            </div>
          </div>
          <div style={{height: 30, width: 1, background: "var(--border)"}}></div>
          <div>
            <div style={{fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Ocurrencia</div>
            <div className="mono" style={{fontSize: 13, marginTop: 2}}>{D.fmtDate(s.fecha)}</div>
          </div>
          <div>
            <div style={{fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Reportado</div>
            <div className="mono" style={{fontSize: 13, marginTop: 2}}>{UI.timeAgo(s.fechaReporte)}</div>
          </div>
          <div className="inbox-detail-actions" style={{marginLeft: "auto"}}>
            <button className="btn sm"><I.Reply size={13}/>Responder</button>
            <button className="btn sm"><I.Forward size={13}/>Derivar</button>
            <button className="btn sm primary"><I.CheckCircle size={13}/>Aprobar trámite</button>
            <button className="btn ghost icon sm"><I.More size={13}/></button>
          </div>
        </div>
      </div>

      <div className="inbox-detail-body">
        {/* AI Summary */}
        <div className="ai-summary mb-16">
          <div className="ai-summary-icon"><I.Sparkles size={14}/></div>
          <div style={{flex: 1}}>
            <b>Resumen IA · clasificación automática</b>
            <p>{s.aiSummary}</p>
          </div>
        </div>

        {/* Póliza vinculada */}
        <div className="inbox-detail-section">
          <h4>Póliza vinculada</h4>
          <div style={{display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap"}}>
            <div style={{
              width: 38, height: 38, borderRadius: 9, background: "var(--primary-soft)",
              color: "var(--primary)", display: "grid", placeItems: "center", flexShrink: 0
            }}><I.Shield size={17}/></div>
            <div style={{flex: 1, minWidth: 200}}>
              <div className="mono" style={{fontWeight: 600, fontSize: 13.5}}>{p?.numero || "—"}</div>
              <div style={{fontSize: 12, color: "var(--muted)"}}>{p?.tipo} · {p?.cobertura}</div>
            </div>
            <div>
              <div style={{fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Aseguradora</div>
              <div style={{fontSize: 13, marginTop: 2}}>{a?.razonSocial}</div>
            </div>
            <div>
              <div style={{fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Suma asegurada</div>
              <div className="mono" style={{fontSize: 13, marginTop: 2}}>{p?.suma ? D.fmtAR(p.suma) : "—"}</div>
            </div>
            <button className="btn sm" onClick={() => onNavigate("polizas", { polizaId: p.id })}>Ver póliza<I.ArrowUpRight size={12}/></button>
          </div>
        </div>

        {/* Descripción */}
        <div className="inbox-detail-section">
          <h4>Descripción de los hechos</h4>
          <p style={{margin: 0, lineHeight: 1.55, fontSize: 13.5, color: "var(--fg-2)"}}>{s.descripcion}</p>
        </div>

        {/* Documentos */}
        <div className="inbox-detail-section">
          <h4 style={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
            <span>Documentos adjuntos · {s.docs.length}</span>
            <button className="btn sm ghost"><I.Download size={12}/>Descargar todo</button>
          </h4>
          <div className="docs-grid">
            {s.docs.map((d, i) => (
              <div key={i} className="doc-card">
                <div className="doc-thumb">
                  {d.tipo === "img" ? <I.Image size={28}/> : <I.FileText size={28}/>}
                  {d.ai && <span className="ai-tag">IA</span>}
                </div>
                <div className="doc-meta">
                  <b>{d.nombre}</b>
                  <small>{d.tamaño}</small>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notas / timeline */}
        <div className="inbox-detail-section">
          <h4>Línea de tiempo</h4>
          <div style={{display: "flex", flexDirection: "column", gap: 10, fontSize: 12.5}}>
            <div style={{display: "flex", gap: 12}}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", background: "var(--primary)", color: "#fff",
                display: "grid", placeItems: "center", flexShrink: 0
              }}><I.Sparkles size={12}/></div>
              <div>
                <b style={{fontSize: 12.5}}>IA procesó adjuntos</b>
                <div style={{color: "var(--muted)"}}>{UI.timeAgo(s.fechaReporte)} · clasificación automática + extracción de datos</div>
              </div>
            </div>
            <div style={{display: "flex", gap: 12}}>
              <div style={{
                width: 24, height: 24, borderRadius: "50%", background: "var(--whatsapp)", color: "#fff",
                display: "grid", placeItems: "center", flexShrink: 0
              }}><I.WhatsApp size={12}/></div>
              <div>
                <b style={{fontSize: 12.5}}>Reporte recibido</b>
                <div style={{color: "var(--muted)"}}>{UI.timeAgo(s.fechaReporte)} · vía WhatsApp Business · {D.clienteLabel(c)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// =============================================================
// NUEVO SINIESTRO — pantalla de alta (full-page wizard-style form)
// =============================================================

const TIPOS_EVENTO = [
  { id: "auto",     label: "Accidente vehicular", desc: "Choque, colisión, vuelco",         icon: "Shield",  ramo: "Automotor" },
  { id: "robo",     label: "Robo / Hurto",        desc: "Total, parcial o accesorios",      icon: "Lock",    ramo: "Automotor" },
  { id: "granizo",  label: "Granizo / Clima",     desc: "Daños por fenómeno meteorológico", icon: "Alert",   ramo: "Automotor" },
  { id: "hogar",    label: "Hogar / Comercio",    desc: "Incendio, agua, daños de terceros",icon: "Building",ramo: "Hogar" },
  { id: "art",      label: "Accidente laboral",   desc: "ART · empleado en relación dep.",  icon: "User",    ramo: "ART" },
  { id: "otro",     label: "Otro siniestro",      desc: "Lesiones, RC, vida, agro",         icon: "FileText",ramo: "—" },
];

const CANALES = [
  { id: "presencial", label: "Presencial / Productor",   icon: "User" },
  { id: "telefono",   label: "Llamada telefónica",       icon: "Phone" },
  { id: "whatsapp",   label: "WhatsApp",                 icon: "WhatsApp" },
  { id: "email",      label: "Correo electrónico",       icon: "Mail" },
];

const NuevoSiniestroView = ({ onCancel, onCreate, onNavigate }) => {
  const D = window.PolData;

  // Form state ---------------------------------------------------------------
  const [form, setForm] = useState({
    clienteId: "",
    polizaId: "",
    tipoEvento: "auto",
    fecha: D.TODAY,
    hora: "14:30",
    lugar: "",
    titulo: "",
    descripcion: "",
    canal: "presencial",
    terceros: false,
    heridos: false,
    denunciaPolicial: false,
    prioridad: "media",
    aiAssist: true,
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Cliente search ----------------------------------------------------------
  const [clienteSearch, setClienteSearch] = useState("");
  const clienteResults = useMemo(() => {
    if (!clienteSearch) return D.CLIENTES.filter(c => c.estado === "activo").slice(0, 6);
    const q = clienteSearch.toLowerCase();
    return D.CLIENTES.filter(c => c.estado === "activo" && (
      D.clienteLabel(c).toLowerCase().includes(q) ||
      D.clienteIdent(c).toLowerCase().includes(q)
    )).slice(0, 8);
  }, [clienteSearch]);

  const cliente = D.findCliente(form.clienteId);
  const polizasCliente = form.clienteId
    ? D.POLIZAS.filter(p => p.clienteId === form.clienteId && p.estado !== "anulada" && p.estado !== "vencida")
    : [];
  const poliza = D.findPoliza(form.polizaId);
  const aseguradora = poliza ? D.findAseguradora(poliza.aseguradoraId) : null;

  // Documents (mock) --------------------------------------------------------
  const [docs, setDocs] = useState([]);
  const addMockDoc = (kind) => {
    const samples = {
      img: [
        { tipo: "img", nombre: "frente_vehiculo.jpg",  tamaño: "2.1 MB", ai: true },
        { tipo: "img", nombre: "lateral_izquierdo.jpg",tamaño: "1.7 MB", ai: true },
        { tipo: "img", nombre: "patente_tercero.jpg",  tamaño: "0.9 MB", ai: true },
      ],
      pdf: [
        { tipo: "pdf", nombre: "denuncia_policial.pdf", tamaño: "0.4 MB", ai: false },
        { tipo: "pdf", nombre: "constancia_seguro.pdf", tamaño: "0.2 MB", ai: false },
      ],
    };
    const pool = samples[kind];
    const next = pool[docs.filter(d => d.tipo === kind).length % pool.length];
    setDocs(d => [...d, { ...next, id: Date.now() + Math.random() }]);
  };
  const removeDoc = (id) => setDocs(d => d.filter(x => x.id !== id));

  // Validation --------------------------------------------------------------
  const required = ["clienteId", "polizaId", "titulo", "fecha"];
  const missing = required.filter(k => !form[k]);
  const canSubmit = missing.length === 0;

  // Stepper helpers ---------------------------------------------------------
  const sections = [
    { id: "cliente", label: "Cliente y póliza", done: !!(form.clienteId && form.polizaId) },
    { id: "evento",  label: "Tipo de evento",   done: !!form.tipoEvento },
    { id: "detalle", label: "Detalle",          done: !!(form.titulo && form.descripcion) },
    { id: "docs",    label: "Documentación",    done: docs.length > 0 },
    { id: "canal",   label: "Canal y revisión", done: !!form.canal },
  ];

  return (
    <>
      {/* ====== HEADER ====== */}
      <div className="page-head" style={{paddingBottom: 12, borderBottom: "1px solid var(--border)", marginBottom: 0}}>
        <div style={{display: "flex", alignItems: "center", gap: 14, minWidth: 0}}>
          <button className="btn ghost icon" onClick={onCancel} aria-label="Volver">
            <I.ChevronLeft size={16}/>
          </button>
          <div style={{minWidth: 0}}>
            <div style={{display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)", marginBottom: 4}}>
              <span>Siniestros</span>
              <I.ChevronRight size={11}/>
              <b style={{color: "var(--fg-2)", fontWeight: 600}}>Nuevo siniestro</b>
            </div>
            <h1 className="page-title" style={{fontSize: 22}}>Cargar nuevo siniestro</h1>
            <p className="page-subtitle">
              Completá los datos del evento. La IA asistirá en la clasificación y notificación a la aseguradora.
            </p>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn ghost" onClick={onCancel}>Cancelar</button>
          <button className="btn"><I.Save size={14}/>Guardar borrador</button>
          <button
            className="btn primary"
            disabled={!canSubmit}
            title={!canSubmit ? `Faltan datos: ${missing.join(", ")}` : undefined}
            onClick={onCreate}>
            <I.Check size={14}/>Crear siniestro
          </button>
        </div>
      </div>

      {/* ====== TWO-COLUMN BODY ====== */}
      <div className="ns-grid">
        {/* ---------- LEFT: stepper / progress ---------- */}
        <aside className="ns-stepper">
          <div className="ns-stepper-title">Progreso</div>
          {sections.map((s, i) => (
            <a key={s.id} href={`#ns-${s.id}`} className="ns-step" data-done={s.done}>
              <div className="ns-step-num">{s.done ? <I.Check size={11}/> : i + 1}</div>
              <div>
                <div className="ns-step-label">{s.label}</div>
                <div className="ns-step-state">{s.done ? "Completo" : "Pendiente"}</div>
              </div>
            </a>
          ))}

          <div className="ns-stepper-divider"></div>
          <div className="ns-summary">
            <div className="ns-summary-num mono">
              SIN-{new Date().getFullYear()}-<b>{String(D.SINIESTROS.length + 1).padStart(4, "0")}</b>
            </div>
            <div className="ns-summary-meta">N° provisorio · se asigna definitivo al confirmar</div>
          </div>

          {form.aiAssist && (
            <div className="ai-summary" style={{marginTop: 14, padding: "10px 12px"}}>
              <div className="ai-summary-icon"><I.Sparkles size={12}/></div>
              <div style={{flex: 1, fontSize: 11.5, lineHeight: 1.45}}>
                <b style={{fontSize: 12}}>Asistencia IA activa</b>
                <p style={{marginTop: 3}}>Generará título, resumen ejecutivo y derivación a la aseguradora al guardar.</p>
              </div>
            </div>
          )}
        </aside>

        {/* ---------- RIGHT: form ---------- */}
        <div className="ns-form">

          {/* ============== 1. Cliente y póliza ============== */}
          <section className="ns-section" id="ns-cliente">
            <header>
              <span className="ns-section-num">1</span>
              <div>
                <h3>Cliente y póliza</h3>
                <p>Buscá el cliente afectado y elegí la póliza vinculada al evento.</p>
              </div>
            </header>

            <div className="form-grid">
              <UI.Field label="Buscar cliente" required span2>
                <div className="input-with-icon">
                  <I.Search size={14}/>
                  <input className="input" placeholder="Nombre, razón social, DNI o CUIT…"
                    value={clienteSearch}
                    onChange={(e) => { setClienteSearch(e.target.value); set("clienteId", ""); set("polizaId", ""); }}/>
                </div>
              </UI.Field>

              <div className="span-2" style={{gridColumn: "span 2"}}>
                {!form.clienteId ? (
                  <div className="ns-cliente-results">
                    {clienteResults.length === 0 && (
                      <div className="ns-empty-mini">Sin resultados — <a>crear cliente nuevo</a></div>
                    )}
                    {clienteResults.map(c => (
                      <button key={c.id} type="button" className="ns-cliente-result"
                        onClick={() => { set("clienteId", c.id); setClienteSearch(""); }}>
                        <UI.ClienteAvatar cliente={c} size={32}/>
                        <div style={{flex: 1, minWidth: 0, textAlign: "left"}}>
                          <div style={{fontWeight: 500, fontSize: 13}}>{D.clienteLabel(c)}</div>
                          <div className="mono" style={{fontSize: 11.5, color: "var(--muted)"}}>{D.clienteIdent(c)}</div>
                        </div>
                        <UI.ClienteBadge tipo={c.tipo}/>
                        <span className="mono" style={{fontSize: 11, color: "var(--muted)"}}>
                          {D.POLIZAS.filter(p => p.clienteId === c.id).length} pól.
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ns-cliente-selected">
                    <UI.ClienteAvatar cliente={cliente} size={42}/>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{display: "flex", alignItems: "center", gap: 8}}>
                        <b style={{fontSize: 14}}>{D.clienteLabel(cliente)}</b>
                        <UI.ClienteBadge tipo={cliente.tipo}/>
                      </div>
                      <div style={{display: "flex", gap: 14, marginTop: 4, fontSize: 12, color: "var(--muted)", flexWrap: "wrap"}}>
                        <span className="mono">{D.clienteIdent(cliente)}</span>
                        <span style={{display: "flex", alignItems: "center", gap: 4}}><I.Mail size={11}/>{cliente.email}</span>
                        <span style={{display: "flex", alignItems: "center", gap: 4}}><I.Phone size={11}/>{cliente.telefono}</span>
                      </div>
                    </div>
                    <button className="btn sm ghost" onClick={() => { set("clienteId", ""); set("polizaId", ""); }}>
                      <I.X size={12}/>Cambiar
                    </button>
                  </div>
                )}
              </div>

              {form.clienteId && (
                <UI.Field label="Póliza vinculada" required hint={polizasCliente.length === 0 ? "Este cliente no tiene pólizas vigentes." : `${polizasCliente.length} pólizas vigentes`} span2>
                  <div className="ns-polizas">
                    {polizasCliente.map(p => {
                      const a = D.findAseguradora(p.aseguradoraId);
                      return (
                        <button key={p.id} type="button"
                          className="ns-poliza"
                          data-active={form.polizaId === p.id}
                          onClick={() => set("polizaId", p.id)}>
                          <div className="ns-poliza-icon"><I.Shield size={15}/></div>
                          <div style={{flex: 1, minWidth: 0}}>
                            <div className="mono" style={{fontWeight: 600, fontSize: 12.5}}>{p.numero}</div>
                            <div style={{fontSize: 11.5, color: "var(--muted)", marginTop: 2}}>{p.tipo} · {p.cobertura}</div>
                          </div>
                          <div style={{textAlign: "right"}}>
                            <div style={{fontSize: 11.5}}>{a?.razonSocial}</div>
                            <UI.PolizaBadge estado={p.estado}/>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </UI.Field>
              )}
            </div>
          </section>

          {/* ============== 2. Tipo de evento ============== */}
          <section className="ns-section" id="ns-evento">
            <header>
              <span className="ns-section-num">2</span>
              <div>
                <h3>Tipo de evento</h3>
                <p>Seleccioná la categoría — define el flujo de documentación y la aseguradora a notificar.</p>
              </div>
            </header>

            <div className="ns-tipos">
              {TIPOS_EVENTO.map(t => {
                const Ico = I[t.icon] || I.Alert;
                return (
                  <button key={t.id} type="button"
                    className="ns-tipo"
                    data-active={form.tipoEvento === t.id}
                    onClick={() => set("tipoEvento", t.id)}>
                    <div className="ns-tipo-icon"><Ico size={18}/></div>
                    <div className="ns-tipo-label">{t.label}</div>
                    <div className="ns-tipo-desc">{t.desc}</div>
                    <div className="ns-tipo-ramo mono">{t.ramo}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* ============== 3. Detalle del evento ============== */}
          <section className="ns-section" id="ns-detalle">
            <header>
              <span className="ns-section-num">3</span>
              <div>
                <h3>Detalle del evento</h3>
                <p>Cuándo, dónde y qué pasó. La IA propondrá un título si lo dejás vacío.</p>
              </div>
            </header>

            <div className="form-grid">
              <UI.Field label="Fecha del evento" required>
                <input className="input mono" type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} max={D.TODAY}/>
              </UI.Field>
              <UI.Field label="Hora aproximada">
                <input className="input mono" type="time" value={form.hora} onChange={(e) => set("hora", e.target.value)}/>
              </UI.Field>

              <UI.Field label="Lugar / dirección" span2 hint="Calle, intersección, ciudad o referencia">
                <div className="input-with-icon">
                  <I.MapPin size={14}/>
                  <input className="input" placeholder="Av. Cabildo y Juramento, CABA"
                    value={form.lugar} onChange={(e) => set("lugar", e.target.value)}/>
                </div>
              </UI.Field>

              <UI.Field label="Título del siniestro" required span2 hint={!form.titulo && form.aiAssist ? "✨ La IA generará un título a partir de la descripción si lo dejás vacío." : undefined}>
                <input className="input" placeholder="Ej: Choque trasero en Av. Cabildo y Juramento"
                  value={form.titulo} onChange={(e) => set("titulo", e.target.value)}/>
              </UI.Field>

              <UI.Field label="Descripción de los hechos" required span2>
                <textarea className="textarea" rows={5}
                  placeholder="Relato del cliente o del productor: qué pasó, en qué condiciones, daños observables, terceros involucrados…"
                  value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)}/>
              </UI.Field>

              <div className="form-section-label">Circunstancias</div>

              <UI.Field span2>
                <div className="ns-checks">
                  <label className="checkbox">
                    <input type="checkbox" checked={form.terceros} onChange={(e) => set("terceros", e.target.checked)}/>
                    <span>Hubo terceros involucrados</span>
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" checked={form.heridos} onChange={(e) => set("heridos", e.target.checked)}/>
                    <span>Personas lesionadas</span>
                  </label>
                  <label className="checkbox">
                    <input type="checkbox" checked={form.denunciaPolicial} onChange={(e) => set("denunciaPolicial", e.target.checked)}/>
                    <span>Denuncia policial radicada</span>
                  </label>
                </div>
              </UI.Field>

              <UI.Field label="Prioridad" span2>
                <UI.Segmented
                  value={form.prioridad}
                  onChange={(v) => set("prioridad", v)}
                  options={[
                    { value: "baja",   label: "Baja" },
                    { value: "media",  label: "Media" },
                    { value: "alta",   label: "Alta" },
                    { value: "urgente",label: "Urgente · 24 hs" },
                  ]}
                />
              </UI.Field>
            </div>
          </section>

          {/* ============== 4. Documentación ============== */}
          <section className="ns-section" id="ns-docs">
            <header>
              <span className="ns-section-num">4</span>
              <div>
                <h3>Documentación adjunta</h3>
                <p>Fotos del daño, denuncia policial, presupuestos, parte médico. La IA extraerá datos automáticamente.</p>
              </div>
            </header>

            <div className="ns-dropzone">
              <I.Upload size={26}/>
              <b>Arrastrá archivos o hacé clic para subir</b>
              <small>Formatos: JPG, PNG, PDF · máx 25 MB por archivo</small>
              <div style={{display: "flex", gap: 8, marginTop: 8}}>
                <button type="button" className="btn sm" onClick={() => addMockDoc("img")}>
                  <I.Image size={12}/>Adjuntar foto
                </button>
                <button type="button" className="btn sm" onClick={() => addMockDoc("pdf")}>
                  <I.FileText size={12}/>Adjuntar PDF
                </button>
              </div>
            </div>

            {docs.length > 0 && (
              <div className="docs-grid" style={{marginTop: 14}}>
                {docs.map(d => (
                  <div key={d.id} className="doc-card">
                    <div className="doc-thumb">
                      {d.tipo === "img" ? <I.Image size={26}/> : <I.FileText size={26}/>}
                      {d.ai && <span className="ai-tag">IA</span>}
                      <button type="button" className="ns-doc-remove" onClick={() => removeDoc(d.id)} aria-label="Quitar">
                        <I.X size={11}/>
                      </button>
                    </div>
                    <div className="doc-meta">
                      <b>{d.nombre}</b>
                      <small>{d.tamaño}{d.ai ? " · datos extraídos" : ""}</small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ============== 5. Canal y revisión ============== */}
          <section className="ns-section" id="ns-canal">
            <header>
              <span className="ns-section-num">5</span>
              <div>
                <h3>Canal de ingreso y notificaciones</h3>
                <p>Cómo se reportó el siniestro y qué automatizaciones aplicar al guardar.</p>
              </div>
            </header>

            <UI.Field label="Canal de origen" span2>
              <div className="ns-canales">
                {CANALES.map(c => {
                  const Ico = I[c.icon] || I.Mail;
                  return (
                    <button key={c.id} type="button"
                      className="ns-canal"
                      data-active={form.canal === c.id}
                      onClick={() => set("canal", c.id)}>
                      <Ico size={15}/>
                      <span>{c.label}</span>
                    </button>
                  );
                })}
              </div>
            </UI.Field>

            <div className="ns-toggles">
              <label className="ns-toggle">
                <input type="checkbox" checked={form.aiAssist} onChange={(e) => set("aiAssist", e.target.checked)}/>
                <div>
                  <b>Asistencia IA</b>
                  <small>Genera título, resumen ejecutivo y clasifica adjuntos al guardar.</small>
                </div>
              </label>
              <label className="ns-toggle">
                <input type="checkbox" defaultChecked/>
                <div>
                  <b>Notificar a la aseguradora</b>
                  <small>{aseguradora ? `Envía denuncia a ${aseguradora.razonSocial} dentro de las próximas 2 hs.` : "Seleccioná una póliza para definir la aseguradora."}</small>
                </div>
              </label>
              <label className="ns-toggle">
                <input type="checkbox" defaultChecked/>
                <div>
                  <b>Confirmar al cliente por WhatsApp</b>
                  <small>{cliente ? `Mensaje a ${cliente.telefono} con N° de siniestro.` : "Seleccioná un cliente."}</small>
                </div>
              </label>
            </div>

            {/* Resumen final */}
            <div className="ns-resumen">
              <div className="ns-resumen-title">
                <I.CheckCircle size={14}/>Resumen antes de crear
              </div>
              <div className="ns-resumen-grid">
                <UI.KV k="Cliente" v={cliente ? D.clienteLabel(cliente) : <em style={{color:"var(--muted-2)"}}>—</em>}/>
                <UI.KV k="Póliza" v={poliza ? poliza.numero : <em style={{color:"var(--muted-2)"}}>—</em>} mono={!!poliza}/>
                <UI.KV k="Tipo" v={TIPOS_EVENTO.find(t => t.id === form.tipoEvento)?.label}/>
                <UI.KV k="Aseguradora" v={aseguradora ? aseguradora.razonSocial : <em style={{color:"var(--muted-2)"}}>—</em>}/>
                <UI.KV k="Ocurrencia" v={`${D.fmtDate(form.fecha)} · ${form.hora}`} mono/>
                <UI.KV k="Lugar" v={form.lugar || <em style={{color:"var(--muted-2)"}}>—</em>}/>
                <UI.KV k="Adjuntos" v={`${docs.length} archivo${docs.length === 1 ? "" : "s"}`}/>
                <UI.KV k="Prioridad" v={form.prioridad.charAt(0).toUpperCase() + form.prioridad.slice(1)}/>
              </div>
            </div>
          </section>

          {/* ============== Sticky footer ============== */}
          <div className="ns-foot">
            <div style={{fontSize: 12, color: "var(--muted)"}}>
              {canSubmit
                ? <span style={{display:"flex", alignItems:"center", gap:6, color:"var(--accent)"}}><I.Check size={12}/>Listo para crear</span>
                : <span style={{display:"flex", alignItems:"center", gap:6}}><I.AlertCircle size={12}/>Faltan datos: {missing.map(m => ({clienteId:"cliente", polizaId:"póliza", titulo:"título", fecha:"fecha"}[m])).join(", ")}</span>
              }
            </div>
            <div style={{display: "flex", gap: 8}}>
              <button className="btn ghost" onClick={onCancel}>Cancelar</button>
              <button className="btn"><I.Save size={14}/>Guardar borrador</button>
              <button
                className="btn primary"
                disabled={!canSubmit}
                onClick={onCreate}>
                <I.Check size={14}/>Crear siniestro
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

window.SiniestrosView = SiniestrosView;
