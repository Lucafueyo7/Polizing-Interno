/* Polizing — Login view */

const LoginView = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = (e) => {
    e && e.preventDefault();
    if (!email || !password) {
      setError("Completá todos los campos.");
      return;
    }
    setLoading(true);
    setError("");
    setTimeout(() => {
      setLoading(false);
      onLogin({ email, role: email.includes("admin") ? "Administrativo" : "Productor" });
    }, 700);
  };

  const fillDemo = (u) => {
    setEmail(u.email);
    setPassword("••••••••");
    setTimeout(() => onLogin({ email: u.email, role: u.role, name: u.name }), 250);
  };

  const demoUsers = [
    { name: "Mariano Pereyra",  email: "[email protected]", role: "Productor" },
    { name: "Lucía Bertotto",   email: "[email protected]",     role: "Administrativo" },
  ];

  return (
    <div className="login">
      <aside className="login-side">
        <div className="login-brand">
          <div className="login-logo">P</div>
          <div>
            <small>Software</small>
            <b>Polizing</b>
          </div>
        </div>

        <div className="login-pitch">
          <h1>Gestión centralizada para tu productora de seguros.</h1>
          <p>
            Pólizas, clientes, aseguradoras y siniestros — en un solo panel.
            Reportes vía WhatsApp procesados con IA, validación de pagos masivos
            y alertas de vencimientos automatizadas.
          </p>
          <div className="login-stats">
            <div className="login-stat">
              <b>1.284</b>
              <small>Pólizas activas</small>
            </div>
            <div className="login-stat">
              <b>24/7</b>
              <small>Reportes WhatsApp</small>
            </div>
            <div className="login-stat">
              <b>99,8%</b>
              <small>Disponibilidad</small>
            </div>
          </div>
        </div>

        <div className="login-foot">
          © 2026 Polizing · v2.4.1 · Sólo personal autorizado
        </div>
      </aside>

      <main className="login-form-side">
        <form className="login-form" onSubmit={submit}>
          <h2>Ingresá a tu cuenta</h2>
          <p>Acceso exclusivo para usuarios Productor y Administrativo.</p>

          <div className="field">
            <label>Email corporativo<span className="req">*</span></label>
            <div className="input-with-icon">
              <I.Mail size={15}/>
              <input
                className="input"
                type="email"
                placeholder="[email protected]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <div className="field">
            <label>Contraseña<span className="req">*</span></label>
            <div className="input-with-icon">
              <I.Lock size={15}/>
              <input
                className="input"
                type={showPw ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 38 }}
              />
              <button
                type="button"
                onClick={() => setShowPw(s => !s)}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  width: 26, height: 26, display: "grid", placeItems: "center",
                  border: "none", background: "transparent", color: "var(--muted)", borderRadius: 5,
                }}
                aria-label="Mostrar/ocultar contraseña"
              >
                {showPw ? <I.EyeOff size={15}/> : <I.Eye size={15}/>}
              </button>
            </div>
          </div>

          <div className="helper">
            <label className="checkbox">
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}/>
              Recordarme
            </label>
            <a href="#" onClick={(e) => e.preventDefault()}>¿Olvidaste tu contraseña?</a>
          </div>

          {error && (
            <div style={{
              background: "var(--danger-soft)", color: "var(--danger)",
              padding: "10px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 12,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <I.AlertCircle size={14}/>{error}
            </div>
          )}

          <button className="btn primary" type="submit" disabled={loading}>
            {loading ? (
              <><span style={{
                width: 14, height: 14, border: "2px solid rgba(255,255,255,.3)",
                borderTopColor: "#fff", borderRadius: "50%", display: "inline-block",
                animation: "spin 600ms linear infinite",
              }}></span>Validando…</>
            ) : (
              <>Ingresar<I.ArrowRight size={15}/></>
            )}
          </button>

          <div className="login-divider">Acceso rápido demo</div>

          <div className="login-demo-users">
            {demoUsers.map((u, i) => (
              <button key={"demo-" + i} type="button" className="login-demo-user" onClick={() => fillDemo(u)}>
                <div className="avatar-sm" style={{width: 32, height: 32, fontSize: 12}}>
                  {u.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                </div>
                <div style={{minWidth: 0}}>
                  <b>{u.name}</b>
                  <small>{u.email}</small>
                </div>
                <span className="role-tag">{u.role}</span>
              </button>
            ))}
          </div>
        </form>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

window.LoginView = LoginView;
