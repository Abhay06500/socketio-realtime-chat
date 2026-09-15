import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Login page component
export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Store login form values
  const [form, setForm] = useState({
    email: "demo1@example.com",
    password: "Demo123!"
  });

  // Store login error messages
  const [error, setError] = useState("");

  // Track form submission state
  const [submitting, setSubmitting] = useState(false);

  // Redirect authenticated users to the chat page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Update form field values
  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  // Handle login form submission
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // Authenticate the user
      await login(form);

      // Redirect to the main chat page after successful login
      navigate("/");
    } catch (requestError) {
      // Display login error message
      setError(requestError.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* Application branding */}
        <div className="brand-mark">RC</div>
        <p className="eyebrow">MERN technical task</p>

        <h1>Welcome back</h1>

        <p className="auth-subtitle">
          Sign in to continue to the real-time chat application.
        </p>

        {/* Display login error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Login form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              required
            />
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Demo account credentials */}
        <div className="demo-box">
          <strong>Demo account</strong>
          <span>demo1@example.com / Demo123!</span>
        </div>

        {/* Link to the registration page */}
        <p className="auth-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}