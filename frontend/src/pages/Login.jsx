import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";

const Login = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const data = await login(
        form.username,
        form.password
      );

      localStorage.setItem("btc-token", data.token);

      localStorage.setItem(
        "btc-user",
        JSON.stringify({
          username: data.username,
          role: data.role,
        })
      );

      navigate("/admin");
    } catch (err) {
      console.error("Login failed:", err);

      if (err.response?.status === 401) {
        setError("Invalid username or password.");
      } else {
        setError(
          "Unable to connect to the authentication server."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-intro">
          <div className="login-brand-mark">
            <span>BT</span>
          </div>

          <p className="eyebrow">BEHIND THE CODE</p>

          <h1>
            Welcome
            <br />
            back<span className="accent-dot">.</span>
          </h1>

          <p className="login-intro-text">
            Sign in to continue writing, building, and
            managing your developer journal.
          </p>

          <div className="login-intro-line" />

          <p className="login-intro-note">
            A private workspace for the person behind
            the code.
          </p>
        </div>

        <div className="login-panel">
          <div className="login-panel-header">
            <p className="eyebrow">ADMIN ACCESS</p>

            <h2>
              Sign in<span className="accent-dot">.</span>
            </h2>

            <p>
              Enter your credentials to access the
              dashboard.
            </p>
          </div>

          <form
            className="login-form"
            onSubmit={handleSubmit}
          >
            {error && (
              <div
                className="login-error"
                role="alert"
              >
                <span className="login-error-icon">
                  !
                </span>

                <span>{error}</span>
              </div>
            )}

            <div className="login-form-group">
              <label htmlFor="username">
                Username
              </label>

              <input
                id="username"
                name="username"
                type="text"
                value={form.username}
                onChange={handleChange}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>

            <div className="login-form-group">
              <div className="login-label-row">
                <label htmlFor="password">
                  Password
                </label>

                <span className="login-secure-label">
                  Secure access
                </span>
              </div>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              <span>
                {loading ? "Signing in..." : "Sign in"}
              </span>

              {!loading && (
                <span className="login-submit-arrow">
                  →
                </span>
              )}
            </button>
          </form>

          <div className="login-panel-footer">
            <span>Behind the Code</span>
            <span>Admin workspace</span>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;