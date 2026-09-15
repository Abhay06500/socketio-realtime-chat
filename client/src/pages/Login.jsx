import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFieldError, validateAuthForm } from "../utils/authValidation";

// Login page component
export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Store login form values
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  // Store login error messages
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Track form submission state
  const [submitting, setSubmitting] = useState(false);

  // Redirect authenticated users to the chat page
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Update form field values
  function updateField(event) {
    const { name, value } = event.target;
    const fieldError = getFieldError(event.target);
    setForm((current) => ({
      ...current,
      [name]: value
    }));
    setFieldErrors((current) => current[name]
      ? { ...current, [name]: fieldError }
      : current);
  }

  function validateField(event) {
    const { name } = event.target;
    const fieldError = getFieldError(event.target);
    setFieldErrors((current) => ({ ...current, [name]: fieldError }));
  }

  // Handle login form submission
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const errors = validateAuthForm(event.currentTarget);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

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

        <h1>Welcome back</h1>

        <p className="auth-subtitle">
          Sign in to continue to the real-time chat application.
        </p>

        {/* Display login error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Login form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              onBlur={validateField}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "login-email-error" : undefined}
              required
            />
            {fieldErrors.email && (
              <span className="field-error" id="login-email-error" role="alert">
                {fieldErrors.email}
              </span>
            )}
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              onBlur={validateField}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "login-password-error" : undefined}
              required
            />
            {fieldErrors.password && (
              <span className="field-error" id="login-password-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Link to the registration page */}
        <p className="auth-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
