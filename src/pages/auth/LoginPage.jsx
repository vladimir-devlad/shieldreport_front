import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { loginRequest } from "../../api/authApi";
import "./LoginPage.scss";

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data } = await loginRequest(form.username, form.password);
      login(data.access_token);
      setSuccess(true);
      // Esperamos 1.5s para que el usuario vea el mensaje, luego redirigimos
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login">
      {/* Panel decorativo izquierdo — solo desktop */}
      <div className="login__brand">
        <h1>Panel de Administración</h1>
        <p>
          Gestiona usuarios, reportes y configuraciones desde un solo lugar.
        </p>
      </div>

      {/* Tarjeta del formulario */}
      <div className="login__card">
        <div className="login__header">
          <div className="login__logo">
            <span>⚡</span>
          </div>
          <h2 className="login__title">Bienvenido</h2>
          <p className="login__subtitle">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {error && <p className="login__error">⚠ {error}</p>}
        {success && (
          <p className="login__success">✅ Redirigiendo al dashboard...</p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login__field">
            <label htmlFor="username">Usuario</label>
            <div className="login__input-wrapper">
              <span className="icon">✉</span>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Tu nombre de usuario"
                value={form.username}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="login__field">
            <label htmlFor="password">Contraseña</label>
            <div className="login__input-wrapper">
              <span className="icon">🔒</span>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button className="login__button" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Ingresar →"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
