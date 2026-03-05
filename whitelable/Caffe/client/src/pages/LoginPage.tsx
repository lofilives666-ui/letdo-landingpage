import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../api/client";
import { ADMIN_SESSION_KEY } from "../constants";

export function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("Nikkis");
  const [password, setPassword] = useState("Nikkis@1234");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const token = await adminLogin(username, password);
      sessionStorage.setItem(ADMIN_SESSION_KEY, token);
      setError("");
      navigate("/admin/home");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mobile-shell user-fullscreen">
      <section className="phone-frame auth-screen user-fullscreen">
        <div className="auth-gradient" />
        <div className="auth-shell">
          <header className="auth-head">
            <p className="auth-kicker">NIKKIS ADMIN</p>
            <h1>Welcome Back</h1>
            <p>Sign in to manage menu, categories, and item availability.</p>
          </header>

          <form className="auth-form" onSubmit={onSubmit}>
            <label className="auth-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              className="auth-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />

            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <div className="password-wrap">
              <input
                id="password"
                className="auth-input"
                value={password}
                type={showPassword ? "text" : "password"}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            <button className="primary-btn auth-submit" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          {error && <p className="status error">{error}</p>}
          <button className="auth-back" type="button" onClick={() => navigate("/")}>
            Back to Welcome
          </button>
        </div>
      </section>
    </main>
  );
}
