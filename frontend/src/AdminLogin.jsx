
import { useState } from "react";
import axios from "axios";


const API = "https://quiet-battles-backend-sskl.onrender.com/api";

export default function AdminLogin({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/admin/login`, {
        email,
        password
      });

      localStorage.setItem("adminToken", response.data.token);
      onLoginSuccess();
    } catch (err) {
        console.error("Admin login error:", err);

        setError(
            err.response?.data?.message ||
            err.message ||
            "Unable to connect to the server."
        );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <h1>QUIET BATTLES™</h1>
      <h2>ADMIN LOGIN</h2>
      <button type="button" onClick={onBack}>
            Back to Website
      </button>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Admin email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
