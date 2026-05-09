/* Polizing — Pólizas (listado + formulario + detalle) */

const POLIZA_TIPOS = [
  "Automotor", "Hogar", "Vida Individual", "Integral de Comercio",
  "Flota Automotor", "ART", "Agrícola", "Salud", "Caución", "Responsabilidad Civil",
];

const PolizaFormModal = ({ open, onClose, onSave, defaultClienteId }) => {
  const D = window.PolData;
  const [form, setForm] = useState({
    numero: "", clienteId: defaultClienteId || "", aseguradoraId: "",
    tipo: "Automotor", cobertura: "",
    emision: D.TODAY, inicio: "", fin: "",
    suma: "", prima: "", estado: "vigente",
  });
  useEffect(() => {
    setForm(f => ({ ...f, clienteId: defaultClienteId || f.clienteId }));
  }, [defaultClienteId, open]);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <UI.Modal
      open={open} onClose={onClose}
      title="Registrar póliza"
      subtitle="Vinculá un cliente y una aseguradora, y completá los datos de cobertura."
      maxWidth={760}
      footer={<>
        <button className="btn ghost" onClick={onClose}>Cancelar</button>
        <button className="btn">Guardar borrador</button>
        <button className="btn primary" onClick={() => onSave(form)}><I.Check size={14}/>Emitir póliza</button>
      </>}
    >
      <div className="form-grid">
        <div className="form-section-label">Vinculación</div>
        <UI.Field label="Cliente" required>
          <select className="select" value={form.clienteId} onChange={(e) => set("clienteId", e.target.value)}>
            <option value="">Seleccionar cliente…</option>
            {D.CLIENTES.filter(c => c.estado === "activo").map(c => (
              <option key={c.id} value={c.id}>
                {D.clienteLabel(c)} · {D.clienteIdent(c)}
              </option>
            ))}
          </select>
        </UI.Field>
        <UI.Field label="Empresa aseguradora" required>
          <select className="select" value={form.aseguradoraId} onChange={(e) => set("aseguradoraId", e.target.value)}>
            <option value="">Seleccionar aseguradora…</option>
            {D.ASEGURADORAS.map(a => (
              <option key={a.id} value={a.id}>{a.razonSocial}</option>
            ))}
          </select>
        </UI.Field>

        <div className="form-section-label">Datos de la póliza</div>
        <UI.Field label="N° de póliza" required>
          <input className="input mono" value={form.numero} onChange={(e) => set("numero", e.target.value)} placeholder="AUT-918274"/>
        </UI.Field>
        <UI.Field label="Tipo de seguro" required>
          <select className="select" value={form.tipo} onChange={(e) => set("tipo", e.target.value)}>
            {POLIZA_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </UI.Field>
        <UI.Field label="Cobertura" required span2>
          <input className="input" value={form.cobertura} onChange={(e) => set("cobertura", e.target.value)} placeholder="Todo Riesgo c/ Franquicia"/>
        </UI.Field>

        <div className="form-section-label">Vigencia</div>
        <UI.Field label="Fecha de emisión" required>
          <input className="input mono" type="date" value={form.emision} onChange={(e) => set("emision", e.target.value)}/>
        </UI.Field>
        <UI.Field label="Inicio de vigencia" required>
          <input className="input mono" type="date" value={form.inicio} onChange={(e) => set("inicio", e.target.value)}/>
        </UI.Field>
        <UI.Field label="Fin de vigencia" required>
          <input className="input mono" type="date" value={form.fin} onChange={(e) => set("fin", e.target.value)}/>
        </UI.Field>
        <UI.Field label="Estado" required>
          <select className="select" value={form.estado} onChange={(e) => set("estado", e.target.value)}>
            <option value="vigente">Vigente</option>
            <option value="renovada">Renovada</option>
            <option value="anulada">Anulada</option>
          </select>
        </UI.Field>

        <div className="form-section-label">Montos</div>
        <UI.Field label="Suma asegurada (AR$)" required hint="Monto máximo de cobertura">
          <input className="input mono" value={form.suma} onChange={(e) => set("suma", e.target.value)} placeholder="18.500.000"/>
        </UI.Field>
        <UI.Field label="Prima mensual (AR$)" required>
          <input className="input mono" value={form.prima} onChange={(e) => set("prima", e.target.value)} placeholder="38.400"/>
        </UI.Field>
      </div>
    </UI.Modal>
  );
};

const PolizasView = ({ onNavigate, focusPolizaId, newForCliente, clearFocus }) => {
  const D = window.PolData;
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("todos");
  const [tipoSeg, setTipoSeg] = useState("todos");
  const [aseg, setAseg] = useState("todos");
  const [modal, setModal] = useState(false);
  const [defaultClienteId, setDefaultClienteId] = useState("");

  useEffect(() => {
    if (newForCliente) {
      setDefaultClienteId(newForCliente);
      setModal(true);
      clearFocus && clearFocus();
    }
  }, [newForCliente]);

  const filtered = D.POLIZAS.filter(p => {
    if (estado !== "todos" && p.estado !== estado) return false;
    if (tipoSeg !== "todos" && p.tipo !== tipoSeg) return false;
    if (aseg !== "todos" && p.aseguradoraId !== aseg) return false;
    if (search) {
      const q = search.toLowerCase();
      const c = D.findCliente(p.clienteId);
      if (!p.numero.toLowerCase().includes(q) && !D.clienteLabel(c).toLowerCase().includes(q) && !p.tipo.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const counts = {
    todos: D.POLIZAS.length,
    vigente: D.POLIZAS.filter(p => p.estado === "vigente").length,
    proxima: D.POLIZAS.filter(p => p.estado === "proxima").length,
    vencida: D.POLIZAS.filter(p => p.estado === "vencida").length,
    renovada: D.POLIZAS.filter(p => p.estado === "renovada").length,
    anulada: D.POLIZAS.filter(p => p.estado === "anulada").length,
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pólizas</h1>
          <p className="page-subtitle">{D.fmtNum(counts.todos)} pólizas en cartera · {D.fmtNum(counts.vigente)} vigentes · {D.fmtNum(counts.proxima)} próximas a vencer</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={14}/>Exportar</button>
          <button className="btn primary" onClick={() => { setDefaultClienteId(""); setModal(true); }}><I.Plus size={14}/>Nueva póliza</button>
        </div>
      </div>

      <div className="card">
        <div style={{padding: "0 var(--pad-card)", borderBottom: "1px solid var(--border)"}}>
          <UI.Tabs
            tabs={[
              { value: "todos",    label: "Todas",     count: counts.todos },
              { value: "vigente",  label: "Vigentes",  count: counts.vigente },
              { value: "proxima",  label: "Próx. a vencer", count: counts.proxima },
              { value: "renovada", label: "Renovadas", count: counts.renovada },
              { value: "vencida",  label: "Vencidas",  count: counts.vencida },
              { value: "anulada",  label: "Anuladas",  count: counts.anulada },
            ]}
            value={estado} onChange={setEstado}
          />
        </div>
        <div className="card-pad" style={{paddingBottom: 12}}>
          <div className="filterbar">
            <div className="input-with-icon" style={{flex: 1, maxWidth: 360}}>
              <I.Search size={15}/>
              <input className="input" placeholder="Buscar por N° de póliza, cliente, tipo..." value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>
            <select className="select" style={{width: 180}} value={tipoSeg} onChange={(e) => setTipoSeg(e.target.value)}>
              <option value="todos">Todos los tipos</option>
              {POLIZA_TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="select" style={{width: 200}} value={aseg} onChange={(e) => setAseg(e.target.value)}>
              <option value="todos">Todas las aseguradoras</option>
              {D.ASEGURADORAS.map(a => <option key={a.id} value={a.id}>{a.razonSocial}</option>)}
            </select>
            <div className="spacer"></div>
            <button className="btn"><I.Filter size={14}/>Más filtros</button>
          </div>
        </div>
        <div className="table-wrap" style={{borderTop: "1px solid var(--border)"}}>
          <table className="table">
            <thead>
              <tr>
                <th>N° Póliza</th>
                <th>Cliente</th>
                <th>Aseguradora</th>
                <th>Tipo / Cobertura</th>
                <th>Vigencia</th>
                <th className="num">Suma asegurada</th>
                <th className="num">Prima</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const c = D.findCliente(p.clienteId);
                const a = D.findAseguradora(p.aseguradoraId);
                const dias = D.daysUntilExpiry(p);
                return (
                  <tr key={p.id}>
                    <td className="cell-strong mono">{p.numero}</td>
                    <td>
                      <div className="cell-with-avatar">
                        <UI.ClienteAvatar cliente={c} size={26}/>
                        <div className="cell-stack">
                          <span style={{fontWeight: 500}}>{D.clienteLabel(c)}</span>
                          <small className="mono">{D.clienteIdent(c)}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{display: "flex", alignItems: "center", gap: 8}}>
                        <span style={{
                          width: 8, height: 8, borderRadius: 2, background: a.color, flexShrink: 0
                        }}></span>
                        {a.razonSocial}
                      </div>
                    </td>
                    <td>
                      <div className="cell-stack">
                        <span style={{fontWeight: 500}}>{p.tipo}</span>
                        <small>{p.cobertura}</small>
                      </div>
                    </td>
                    <td>
                      <div className="cell-stack">
                        <span className="mono" style={{fontSize: 12.5}}>{D.fmtDate(p.inicio)} → {D.fmtDate(p.fin)}</span>
                        {(p.estado === "vigente" || p.estado === "proxima") && dias >= 0 && dias <= 60 && (
                          <small style={{color: dias <= 15 ? "var(--danger)" : "var(--warn)", fontWeight: 600, fontSize: 11}}>
                            {dias === 0 ? "Vence hoy" : `Vence en ${dias} días`}
                          </small>
                        )}
                      </div>
                    </td>
                    <td className="num mono">{p.suma ? D.fmtAR(p.suma) : "—"}</td>
                    <td className="num mono cell-strong">{D.fmtAR(p.prima)}</td>
                    <td><UI.PolizaBadge estado={p.estado}/></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan="8"><UI.Empty icon={I.Search} title="Sin resultados" subtitle="Probá ajustar los filtros."/></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="card-foot">
          <span>Mostrando <b style={{color: "var(--fg)"}}>{filtered.length}</b> de {counts.todos}</span>
          <span style={{display: "flex", gap: 16}}>
            <span>Prima total: <b className="mono" style={{color: "var(--fg)"}}>{D.fmtAR(filtered.reduce((s,p) => s + p.prima, 0))}</b></span>
          </span>
        </div>
      </div>

      <PolizaFormModal
        open={modal}
        defaultClienteId={defaultClienteId}
        onClose={() => setModal(false)}
        onSave={() => setModal(false)}
      />
    </>
  );
};

window.PolizasView = PolizasView;
