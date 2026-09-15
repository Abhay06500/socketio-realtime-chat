import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFieldError, validateAuthForm } from "../utils/authValidation";

// Registration page component
export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Store registration form values
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  // Store registration error messages
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

  // Handle registration form submission
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    const errors = validateAuthForm(event.currentTarget);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);

    try {
      // Register the new user
      await register(form);

      // Redirect to the main chat page after successful registration
      navigate("/");
    } catch (requestError) {
      // Display registration error message
      setError(requestError.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        {/* Application branding */}
        <div className="brand-mark">RC</div>

        <h1>Create account</h1>

        <p className="auth-subtitle">
          Register a user and start a real-time one-to-one conversation.
        </p>

        {/* Display registration error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Registration form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              onBlur={validateField}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "register-name-error" : undefined}
              minLength={2}
              required
            />
            {fieldErrors.name && (
              <span className="field-error" id="register-name-error" role="alert">
                {fieldErrors.name}
              </span>
            )}
          </label>

          <label>
            Email
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={updateField}
              onBlur={validateField}
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? "register-email-error" : undefined}
              required
            />
            {fieldErrors.email && (
              <span className="field-error" id="register-email-error" role="alert">
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
              aria-describedby={fieldErrors.password ? "register-password-error" : undefined}
              minLength={6}
              required
            />
            {fieldErrors.password && (
              <span className="field-error" id="register-password-error" role="alert">
                {fieldErrors.password}
              </span>
            )}
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Register"}
          </button>
        </form>

        {/* Link to the login page */}
        <p className="auth-footer">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  );
}
