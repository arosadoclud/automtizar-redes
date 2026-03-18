import { useState } from "react";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Syne:wght@700;800&family=JetBrains+Mono:wght@400;500&display=swap');

  body {
    background: #08080f;
    color: #f1f1fa;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  .login-wrap {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #08080f;
    background-image:
      radial-gradient(ellipse 80% 50% at 50% -20%, rgba(34,211,238,0.08) 0%, transparent 60%),
      radial-gradient(ellipse 60% 40% at 80% 100%, rgba(99,102,241,0.06) 0%, transparent 60%);
    padding: 24px;
  }

  .login-card {
    background: #0f0f1b;
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 20px;
    padding: 40px 44px;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04);
    animation: fadeUp 0.3s cubic-bezier(.34,1.56,.64,1);
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .login-logo {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 32px;
  }

  .login-logo-icon {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%);
    border-radius: 14px;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px;
    box-shadow: 0 4px 20px rgba(99,102,241,0.4);
    flex-shrink: 0;
  }

  .login-logo-text { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .login-logo-sub { font-size: 10px; color: #22d3ee; letter-spacing: 2.5px; text-transform: uppercase; margin-top: 1px; opacity: 0.8; }

  .login-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #f1f1fa;
    margin-bottom: 6px;
  }
  .login-sub { font-size: 13px; color: #8b8bab; margin-bottom: 28px; line-height: 1.5; }

  .form-group { margin-bottom: 18px; }

  .form-label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.7px;
    text-transform: uppercase;
    color: #4a4a68;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .form-input {
    width: 100%;
    background: #14141f;
    border: 1px solid rgba(255,255,255,0.10);
    color: #f1f1fa;
    font-family: 'Inter', sans-serif;
    font-size: 14px;
    padding: 11px 14px;
    border-radius: 10px;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .form-input:focus {
    border-color: #22d3ee;
    box-shadow: 0 0 0 3px rgba(34,211,238,0.1);
  }

  .form-input::placeholder { color: #4a4a68; }

  .btn-login {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 10px;
    background: #22d3ee;
    color: #08080f;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.15s ease;
    border: none;
    margin-top: 8px;
    letter-spacing: 0.3px;
  }

  .btn-login:hover:not(:disabled) {
    background: #00bfe8;
    box-shadow: 0 0 24px rgba(34,211,238,0.4);
  }

  .btn-login:disabled { opacity: 0.6; cursor: not-allowed; }

  .error-box {
    background: rgba(248,113,113,0.1);
    border: 1px solid rgba(248,113,113,0.3);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 13px;
    color: #f87171;
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
    animation: shake 0.3s ease;
  }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    75% { transform: translateX(6px); }
  }

  .login-footer {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #4a4a68;
  }

  .status-dot-sm {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: #4ade80;
    box-shadow: 0 0 8px #4ade80;
    animation: pulse 2.2s infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .spinner-sm {
    width: 16px; height: 16px;
    border: 2px solid rgba(8,8,15,0.3);
    border-top-color: #08080f;
    border-radius: 50%;
    animation: spin 0.65s linear infinite;
    display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.detail || "Email o contraseña incorrectos");
        return;
      }

      const { access_token, user } = await res.json();
      localStorage.setItem("vg_token", access_token);
      localStorage.setItem("vg_user", JSON.stringify(user));
      onLogin();
    } catch {
      setError("No se pudo conectar con el servidor. ¿Está corriendo la API?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-logo">
            <div className="login-logo-icon">🌿</div>
            <div>
              <div className="login-logo-text">VitaGloss</div>
              <div className="login-logo-sub">Social Hub</div>
            </div>
          </div>

          <div className="login-title">Bienvenido de vuelta</div>
          <div className="login-sub">
            Ingresa tus credenciales para acceder al panel de tu equipo.
          </div>

          {error && (
            <div className="error-box">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Correo electrónico</label>
              <input
                className="form-input"
                type="email"
                placeholder="nombre@vitagloss.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contraseña</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
            </div>
            <button className="btn-login" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-sm" />
                  Iniciando sesión...
                </>
              ) : (
                "→ Iniciar sesión"
              )}
            </button>
          </form>

          <div className="login-footer">
            <span className="status-dot-sm" />
            <span>Sistema seguro · Acceso restringido al equipo VitaGloss</span>
          </div>
        </div>
      </div>
    </>
  );
}
