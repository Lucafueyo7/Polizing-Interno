/* Polizing — App shell (sidebar + router) */

const { useState, useEffect, useMemo } = React;

const NAV_ITEMS = [
  { id: "dashboard",    label: "Panel de Control", icon: I.Dashboard },
  { id: "clientes",     label: "Clientes",         icon: I.Users },
  { id: "aseguradoras", label: "Aseguradoras",     icon: I.Building },
  { id: "polizas",      label: "Pólizas",          icon: I.Shield },
  { id: "siniestros",   label: "Siniestros",       icon: I.Alert },
  { id: "pagos",        label: "Pagos masivos",    icon: I.Wallet },
];

const ACCENT_COLOR  = "#0d8a5f";
const PRIMARY_COLOR = "#0f2744";

const Sidebar = ({ active, onNavigate, collapsed, onToggleCollapse, user, sinNuevos, vencer, onLogout }) => (
  <aside className="side">
    <div className="side-brand">
      <div className="side-logo">P</div>
      <div className="side-name">
        Polizing
        <small>Software</small>
      </div>
      <button className="side-collapse-btn" onClick={onToggleCollapse} aria-label="Colapsar">
        {collapsed ? <I.ChevronsRight size={14}/> : <I.ChevronsLeft size={14}/>}
      </button>
    </div>

    <div className="side-section-label">Operación</div>
    <nav className="side-nav">
      {NAV_ITEMS.map(item => {
        const Icn = item.icon;
        const badge = item.id === "siniestros" && sinNuevos ? sinNuevos
                    : item.id === "polizas" && vencer ? vencer : null;
        return (
          <button key={item.id}
            className="side-link"
            data-active={active === item.id}
            onClick={() => onNavigate(item.id)}
            title={collapsed ? item.label : undefined}>
            <Icn size={17}/>
            <span>{item.label}</span>
            {badge && <span className="badge-pill">{badge}</span>}
          </button>
        );
      })}
    </nav>

    <div className="side-section-label">Configuración</div>
    <div style={{padding: "0 10px 12px"}}>
      <button className="side-link" title={collapsed ? "Ajustes" : undefined}>
        <I.Settings size={17}/><span>Ajustes</span>
      </button>
      <button className="side-link" title={collapsed ? "Ayuda" : undefined}>
        <I.Help size={17}/><span>Ayuda</span>
      </button>
    </div>

    <div className="side-user">
      <div className="side-avatar">
        {user.name?.split(" ").map(n => n[0]).slice(0,2).join("") || "U"}
      </div>
      <div className="side-user-meta" style={{flex: 1, minWidth: 0}}>
        <b style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{user.name || user.email}</b>
        <small>{user.role}</small>
      </div>
      <button className="btn ghost icon sm side-user-meta" onClick={onLogout} title="Cerrar sesión" style={{flexShrink: 0}}>
        <I.Logout size={14}/>
      </button>
    </div>
  </aside>
);

const Topbar = ({ active, onSearch, onLogout, theme, onToggleTheme }) => {
  const item = NAV_ITEMS.find(n => n.id === active);
  const isDark = theme === "dark";
  return (
    <header className="topbar">
      <div className="crumb">
        <span>Polizing</span>
        <I.ChevronRight size={12}/>
        <b>{item?.label || ""}</b>
      </div>
      <div className="topbar-search">
        <I.Search size={15}/>
        <input placeholder="Buscar clientes, pólizas, siniestros..." onChange={(e) => onSearch && onSearch(e.target.value)}/>
        <span className="topbar-kbd">⌘ K</span>
      </div>
      <button className="topbar-icon-btn" title={isDark ? "Cambiar a claro" : "Cambiar a oscuro"} onClick={onToggleTheme}>
        {isDark ? <I.Sun size={16}/> : <I.Moon size={16}/>}
      </button>
      <button className="topbar-icon-btn" title="Notificaciones">
        <I.Bell size={16}/>
        <span className="dot"></span>
      </button>
      <button className="topbar-icon-btn" title="Ayuda"><I.Help size={16}/></button>
    </header>
  );
};

const App = () => {
  const [auth, setAuth] = useState(null);
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [navCtx, setNavCtx] = useState({});
  const [theme, setTheme] = useState(() => localStorage.getItem("polizing-theme") || "light");

  // Apply theme tokens to <html>
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.density = "medium";
    document.documentElement.style.setProperty("--accent", ACCENT_COLOR);
    document.documentElement.style.setProperty("--primary", PRIMARY_COLOR);

    const hexToRgb = (h) => {
      const x = h.replace("#","");
      return [parseInt(x.slice(0,2),16), parseInt(x.slice(2,4),16), parseInt(x.slice(4,6),16)];
    };
    const [pr,pg,pb] = hexToRgb(PRIMARY_COLOR);
    document.documentElement.style.setProperty("--primary-soft", `rgba(${pr},${pg},${pb},0.08)`);
    const [ar,ag,ab] = hexToRgb(ACCENT_COLOR);
    document.documentElement.style.setProperty("--accent-soft", `rgba(${ar},${ag},${ab},0.12)`);

    localStorage.setItem("polizing-theme", theme);
  }, [theme]);

  const navigate = (view, ctx = {}) => {
    setActive(view);
    setNavCtx(ctx);
  };

  const D = window.PolData;
  const sinNuevos = D.SINIESTROS.filter(s => s.estado === "nuevo").length;
  const vencer = D.POLIZAS.filter(p => {
    const dias = D.daysUntilExpiry(p);
    return (p.estado === "vigente" || p.estado === "proxima") && dias >= 0 && dias <= 30;
  }).length;

  if (!auth) {
    return <LoginView onLogin={(u) => setAuth({...u, name: u.name || u.email.split("@")[0]})} />;
  }

  return (
    <div className="app" data-collapsed={collapsed} data-auth={!!auth}>
      <Sidebar
        active={active}
        onNavigate={navigate}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        user={auth}
        sinNuevos={sinNuevos}
        vencer={vencer}
        onLogout={() => setAuth(null)}
      />
      <main className="main">
        <Topbar active={active} onLogout={() => setAuth(null)}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === "dark" ? "light" : "dark")}/>
        <div className="page">
          {active === "dashboard"    && <Dashboard onNavigate={navigate} alertasVencer={5}/>}
          {active === "clientes"     && <ClientesView onNavigate={navigate} focusClienteId={navCtx.clienteId} clearFocus={() => setNavCtx({})}/>}
          {active === "aseguradoras" && <AseguradorasView onNavigate={navigate}/>}
          {active === "polizas"      && <PolizasView onNavigate={navigate} focusPolizaId={navCtx.polizaId} newForCliente={navCtx.newForCliente} clearFocus={() => setNavCtx({})}/>}
          {active === "siniestros"   && <SiniestrosView onNavigate={navigate} focusSiniestroId={navCtx.siniestroId} clearFocus={() => setNavCtx({})}/>}
          {active === "pagos"        && <PagosView onNavigate={navigate}/>}
        </div>
      </main>

    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
