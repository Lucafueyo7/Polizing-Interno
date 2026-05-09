/* Polizing — Pagos Masivos (Corporativos) */

const PagosView = ({ onNavigate }) => {
  const D = window.PolData;
  const [filter, setFilter] = useState("pendiente");
  const [selected, setSelected] = useState(D.PAGOS_MASIVOS[0]?.id);

  const filtered = D.PAGOS_MASIVOS.filter(p => filter === "todos" ? true : p.estado === filter);
  const current = D.PAGOS_MASIVOS.find(p => p.id === selected) || filtered[0];

  const totales = {
    pendiente: D.PAGOS_MASIVOS.filter(p => p.estado === "pendiente").reduce((s, p) => s + D.polizaTotal(p), 0),
    validado:  D.PAGOS_MASIVOS.filter(p => p.estado === "validado").reduce((s, p) => s + D.polizaTotal(p), 0),
    polizas:   D.PAGOS_MASIVOS.reduce((s, p) => s + p.items.length, 0),
    pendienteCount: D.PAGOS_MASIVOS.filter(p => p.estado === "pendiente").length,
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Pagos masivos</h1>
          <p className="page-subtitle">Validación de comprobantes de pago — exclusivo clientes corporativos</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Download size={14}/>Exportar conciliación</button>
        </div>
      </div>

      <div className="pagos-summary">
        <div className="kpi pago-card-strong">
          <div className="kpi-label" style={{color: "rgba(255,255,255,.85)"}}><I.Clock size={14}/>Pendientes de validación</div>
          <div className="kpi-value" style={{color: "#fff"}}>{D.fmtAR(totales.pendiente)}</div>
          <div style={{fontSize: 12, color: "rgba(255,255,255,.7)"}}>{totales.pendienteCount} comprobantes</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I.CheckCircle size={14}/>Validados (mes)</div>
          <div className="kpi-value" style={{fontSize: 22}}>{D.fmtAR(totales.validado)}</div>
          <div className="kpi-trend up"><I.TrendUp size={12}/>+12% vs. abril</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I.Shield size={14}/>Pólizas alcanzadas</div>
          <div className="kpi-value">{totales.polizas}</div>
          <div style={{fontSize: 12, color: "var(--muted)"}}>en {D.PAGOS_MASIVOS.length} comprobantes</div>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I.Building size={14}/>Empresas</div>
          <div className="kpi-value">{new Set(D.PAGOS_MASIVOS.map(p => p.clienteId)).size}</div>
          <div style={{fontSize: 12, color: "var(--muted)"}}>con pagos en curso</div>
        </div>
      </div>

      <div style={{display: "grid", gridTemplateColumns: "420px 1fr", gap: "var(--gap)"}}>
        {/* List of pagos */}
        <div className="card">
          <div className="card-head">
            <UI.Segmented
              options={[
                {label: `Pendientes · ${D.PAGOS_MASIVOS.filter(p => p.estado === "pendiente").length}`, value: "pendiente"},
                {label: "Validados", value: "validado"},
                {label: "Todos", value: "todos"},
              ]}
              value={filter} onChange={setFilter}
            />
          </div>
          <div>
            {filtered.map(pago => {
              const c = D.findCliente(pago.clienteId);
              const total = D.polizaTotal(pago);
              return (
                <div key={pago.id}
                  onClick={() => setSelected(pago.id)}
                  style={{
                    padding: "14px 18px",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    background: pago.id === current?.id ? "var(--primary-soft)" : "transparent",
                    borderLeft: pago.id === current?.id ? "3px solid var(--primary)" : "3px solid transparent",
                  }}>
                  <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 6}}>
                    <UI.ClienteAvatar cliente={c} size={28}/>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{fontWeight: 600, fontSize: 13, lineHeight: 1.25, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                        {D.clienteLabel(c)}
                      </div>
                      <div className="mono" style={{fontSize: 11, color: "var(--muted)"}}>{pago.cuit || c.cuit}</div>
                    </div>
                    <span className={`badge ${pago.estado}`}>
                      <span className="dot"></span>{pago.estado === "pendiente" ? "Pendiente" : "Validado"}
                    </span>
                  </div>
                  <div style={{display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 4}}>
                    <div>
                      <div className="mono" style={{fontSize: 12, color: "var(--muted)"}}>{pago.id} · {pago.periodo}</div>
                      <div style={{fontSize: 11.5, color: "var(--muted)", marginTop: 1}}>{pago.items.length} pólizas · {pago.metodoPago}</div>
                    </div>
                    <div className="mono" style={{fontWeight: 600, fontSize: 15, letterSpacing: -0.01}}>{D.fmtAR(total)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail */}
        <div className="card">
          {!current ? (
            <UI.Empty icon={I.Wallet} title="Seleccioná un comprobante" subtitle="Elegí un pago de la lista para validar."/>
          ) : (
            <PagoDetail pago={current}/>
          )}
        </div>
      </div>
    </>
  );
};

const PagoDetail = ({ pago }) => {
  const D = window.PolData;
  const c = D.findCliente(pago.clienteId);
  const total = D.polizaTotal(pago);
  const isPending = pago.estado === "pendiente";

  return (
    <>
      <div className="card-head" style={{flexDirection: "column", alignItems: "stretch", gap: 12, padding: "20px var(--pad-card)"}}>
        <div style={{display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16}}>
          <div>
            <div style={{display: "flex", alignItems: "center", gap: 10, marginBottom: 6}}>
              <span className={`badge ${pago.estado}`}>
                <span className="dot"></span>{isPending ? "Pendiente de validación" : "Validado"}
              </span>
              <span className="mono" style={{fontSize: 12, color: "var(--muted)"}}>{pago.id}</span>
            </div>
            <h2 style={{margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: "-0.015em"}}>{D.clienteLabel(c)}</h2>
            <div style={{fontSize: 13, color: "var(--muted)", marginTop: 4}}>
              {pago.periodo} · Emitido el {D.fmtDate(pago.fechaEmision)}
            </div>
          </div>
          <div style={{textAlign: "right"}}>
            <div style={{fontSize: 11.5, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.06, fontWeight: 600}}>Total a validar</div>
            <div className="mono" style={{fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--fg)"}}>{D.fmtAR(total)}</div>
          </div>
        </div>

        {isPending && (
          <div style={{display: "flex", gap: 8}}>
            <button className="btn"><I.Eye size={14}/>Ver comprobante</button>
            <button className="btn"><I.Download size={14}/>Descargar</button>
            <div className="spacer"></div>
            <button className="btn danger"><I.X size={14}/>Rechazar</button>
            <button className="btn accent"><I.CheckCircle size={14}/>Validar pago</button>
          </div>
        )}
      </div>

      <div className="card-pad" style={{paddingTop: 16, paddingBottom: 16}}>
        <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18}}>
          <div className="inbox-detail-section" style={{margin: 0}}>
            <h4>Método de pago</h4>
            <div style={{fontSize: 13, fontWeight: 500}}>{pago.metodoPago}</div>
            <div className="mono" style={{fontSize: 12, color: "var(--muted)", marginTop: 2}}>{pago.cbu}</div>
          </div>
          <div className="inbox-detail-section" style={{margin: 0}}>
            <h4>N° de comprobante</h4>
            <div className="mono" style={{fontSize: 13, fontWeight: 500}}>{pago.comprobante}</div>
          </div>
          <div className="inbox-detail-section" style={{margin: 0}}>
            <h4>CUIT empresa</h4>
            <div className="mono" style={{fontSize: 13, fontWeight: 500}}>{c.cuit}</div>
            <div style={{fontSize: 12, color: "var(--muted)", marginTop: 2}}>{c.contactoNombre}</div>
          </div>
        </div>

        <h3 style={{margin: "0 0 10px", fontSize: 13, fontWeight: 600, letterSpacing: -0.005}}>Detalle de pago · {pago.items.length} pólizas</h3>

        <div style={{border: "1px solid var(--border)", borderRadius: 9, overflow: "hidden"}}>
          <div className="pago-row head">
            <div>Concepto</div>
            <div>Tipo</div>
            <div className="num">N° Póliza</div>
            <div className="num">Monto</div>
          </div>
          {pago.items.map((it, idx) => {
            const p = D.findPoliza(it.polizaId);
            const a = p ? D.findAseguradora(p.aseguradoraId) : null;
            return (
              <div key={idx} className="pago-row">
                <div>
                  <div style={{fontWeight: 500, fontSize: 13}}>{it.concepto}</div>
                  {a && (
                    <div style={{fontSize: 11.5, color: "var(--muted)", marginTop: 2, display: "flex", alignItems: "center", gap: 6}}>
                      <span style={{width: 7, height: 7, borderRadius: 2, background: a.color}}></span>
                      {a.razonSocial}
                    </div>
                  )}
                </div>
                <div style={{fontSize: 12.5, color: "var(--muted)"}}>{p?.tipo}</div>
                <div className="num mono" style={{fontSize: 12.5}}>{p?.numero}</div>
                <div className="num mono cell-strong" style={{fontSize: 13.5}}>{D.fmtAR(it.monto)}</div>
              </div>
            );
          })}
          <div className="pago-totals">
            <div>Subtotal: <b className="mono">{D.fmtAR(total)}</b></div>
            <div>IVA: <b className="mono">incluido</b></div>
            <div className="grand">Total: <b>{D.fmtAR(total)}</b></div>
          </div>
        </div>

        {isPending && (
          <div style={{
            marginTop: 16, padding: "12px 14px",
            background: "var(--warn-soft)", border: "1px solid #f4d8a8",
            borderRadius: 9, display: "flex", alignItems: "center", gap: 12, fontSize: 12.5,
          }}>
            <I.AlertCircle size={16} style={{color: "var(--warn)", flexShrink: 0}}/>
            <div style={{color: "var(--warn)"}}>
              <b>Verificá manualmente</b> · monto, comprobante y CBU coinciden con la rendición de la empresa antes de validar.
            </div>
          </div>
        )}

        {!isPending && (
          <div style={{
            marginTop: 16, padding: "12px 14px",
            background: "var(--accent-soft)", border: "1px solid #a8e0c5",
            borderRadius: 9, display: "flex", alignItems: "center", gap: 12, fontSize: 12.5,
          }}>
            <I.CheckCircle size={16} style={{color: "var(--accent)", flexShrink: 0}}/>
            <div style={{color: "var(--accent)"}}>
              <b>Pago validado</b> · todas las pólizas asociadas fueron acreditadas en el sistema.
            </div>
          </div>
        )}
      </div>
    </>
  );
};

window.PagosView = PagosView;
