/* Polizing — Dashboard */

const Dashboard = ({ onNavigate, alertasVencer = 5 }) => {
  const D = window.PolData;
  const { POLIZA_STATUS, SIN_STATUS } = window.UI;

  const totalClientes = D.CLIENTES.filter(c => c.estado === "activo").length;
  const totalPolizas = D.POLIZAS.filter(p => p.estado === "vigente" || p.estado === "proxima").length;
  const totalSinTramite = D.SINIESTROS.filter(s => s.estado === "tramite" || s.estado === "nuevo").length;
  const sinNuevos = D.SINIESTROS.filter(s => s.estado === "nuevo");
  const primaMensual = D.POLIZAS.filter(p => p.estado === "vigente" || p.estado === "proxima").reduce((s,p) => s + p.prima, 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p className="page-subtitle">Resumen ejecutivo · Jueves 8 de mayo de 2026</p>
        </div>
        <div className="page-actions">
          <button className="btn"><I.Refresh size={14}/>Actualizar</button>
          <button className="btn"><I.Download size={14}/>Exportar</button>
          <button className="btn primary" onClick={() => onNavigate("polizas")}><I.Plus size={14}/>Nueva póliza</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpis">
        <div className="kpi">
          <div className="kpi-label"><I.Users size={14}/>Clientes activos</div>
          <div className="kpi-value">{D.fmtNum(totalClientes)}</div>
          <div className="kpi-trend up"><I.TrendUp size={12}/>+3 este mes</div>
          <UI.Sparkline values={[42, 44, 45, 47, 48, 49, 50, 51]} color="var(--accent)"/>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I.Shield size={14}/>Pólizas vigentes</div>
          <div className="kpi-value">{D.fmtNum(totalPolizas)}</div>
          <div className="kpi-trend up"><I.TrendUp size={12}/>+12 vs. mes ant.</div>
          <UI.Sparkline values={[120, 124, 126, 128, 130, 132, 130, 134]} color="var(--primary)"/>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I.Alert size={14}/>Siniestros en trámite</div>
          <div className="kpi-value">{D.fmtNum(totalSinTramite)}</div>
          <div className="kpi-trend down"><I.TrendDown size={12}/>−2 vs. semana ant.</div>
          <UI.Sparkline values={[8, 9, 7, 8, 6, 5, 6, 5]} color="var(--warn)"/>
        </div>
        <div className="kpi">
          <div className="kpi-label"><I.Coins size={14}/>Prima mensual</div>
          <div className="kpi-value" style={{fontSize: 22}}>{D.fmtAR(primaMensual)}</div>
          <div className="kpi-trend up"><I.TrendUp size={12}/>+8,4% YoY</div>
          <UI.Sparkline values={[18, 19, 20, 22, 23, 24, 26, 28]} color="var(--info)"/>
        </div>
      </div>

      {/* Siniestros pendientes */}
      <div style={{marginTop: "var(--gap)"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Siniestros pendientes de revisión</h3>
              <p className="card-sub">Reportes recibidos vía WhatsApp procesados con IA</p>
            </div>
            <button className="btn sm" onClick={() => onNavigate("siniestros")}>Bandeja<I.ChevronRight size={14}/></button>
          </div>
          <div>
            {sinNuevos.length === 0 && <UI.Empty title="Sin pendientes" subtitle="Todos los reportes fueron revisados."/>}
            {sinNuevos.map(s => {
              const c = D.findCliente(s.clienteId);
              return (
                <div key={s.id} className="alert-row" onClick={() => onNavigate("siniestros", { siniestroId: s.id })}>
                  <div className="alert-icon whatsapp">
                    <I.WhatsApp size={16}/>
                  </div>
                  <div className="alert-body">
                    <div className="alert-title">{s.titulo}</div>
                    <div className="alert-meta">
                      {D.clienteLabel(c)}
                      <span style={{margin: "0 6px", opacity: .5}}>·</span>
                      {s.docs.length} adjuntos
                      <span style={{margin: "0 6px", opacity: .5}}>·</span>
                      <span className="badge nuevo" style={{padding: "1px 6px", fontSize: 10.5}}>IA procesada</span>
                    </div>
                  </div>
                  <div className="alert-when">{UI.timeAgo(s.fechaReporte)}</div>
                </div>
              );
            })}
          </div>
          {sinNuevos.length > 0 && (
            <div className="card-foot">
              <span><b style={{color: "var(--fg)"}}>{sinNuevos.length}</b> reportes esperan revisión humana</span>
              <button className="btn sm primary" onClick={() => onNavigate("siniestros")}>Revisar ahora</button>
            </div>
          )}
        </div>
      </div>

      {/* Distribution by aseguradora */}
      <div style={{display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "var(--gap)", marginTop: "var(--gap)"}}>
        <div className="card">
          <div className="card-head">
            <div>
              <h3 className="card-title">Distribución por aseguradora</h3>
              <p className="card-sub">Pólizas activas por compañía</p>
            </div>
            <UI.Segmented options={[{label:"Pólizas", value:"p"}, {label:"Prima", value:"m"}]} value="p" onChange={()=>{}}/>
          </div>
          <div className="card-pad">
            {D.ASEGURADORAS.map(a => {
              const count = D.POLIZAS.filter(p => p.aseguradoraId === a.id && p.estado !== "anulada" && p.estado !== "vencida").length;
              const total = D.POLIZAS.filter(p => p.estado !== "anulada" && p.estado !== "vencida").length || 1;
              const pct = (count / total) * 100;
              return (
                <div key={a.id} style={{marginBottom: 14}}>
                  <div style={{display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 5}}>
                    <span style={{fontWeight: 500}}>{a.razonSocial}</span>
                    <span className="mono" style={{color: "var(--muted)"}}>{count} <span style={{opacity: .6}}>· {pct.toFixed(0)}%</span></span>
                  </div>
                  <div style={{height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden"}}>
                    <div style={{height: "100%", width: `${pct}%`, background: a.color, borderRadius: 3}}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h3 className="card-title">Actividad reciente</h3>
          </div>
          <div>
            {[
              { i: I.ShieldCheck, c:"vigente",  t:"Póliza HOG-309218 emitida", d:"AgustinaVázquez · La Federal Seguros", w:"hace 2h" },
              { i: I.WhatsApp,    c:"whatsapp", t:"Nuevo siniestro reportado", d:"SofíaMansilla · Choque trasero", w:"hace 4h" },
              { i: I.CheckCircle, c:"vigente",  t:"Pago validado",             d:"FrigoríficoLas Heras · AR$ 5,21M", w:"hace 6h" },
              { i: I.Edit,        c:"info",     t:"Cliente actualizado",       d:"Distribuidora Pampa Verde", w:"ayer" },
              { i: I.Refresh,     c:"info",     t:"Renovación procesada",      d:"P-2024-0902 · Vida Individual", w:"ayer" },
            ].map((row, idx) => {
              const Icn = row.i;
              const cls = row.c === "whatsapp" ? "whatsapp" : row.c === "vigente" ? "info" : row.c;
              return (
                <div key={idx} className="alert-row">
                  <div className={`alert-icon ${cls}`}><Icn size={16}/></div>
                  <div className="alert-body">
                    <div className="alert-title">{row.t}</div>
                    <div className="alert-meta">{row.d}</div>
                  </div>
                  <div className="alert-when">{row.w}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};

window.Dashboard = Dashboard;
