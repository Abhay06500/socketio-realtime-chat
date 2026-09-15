import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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

  // Handle registration form submission
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
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
        <p className="eyebrow">MERN technical task</p>

        <h1>Create account</h1>

        <p className="auth-subtitle">
          Register a user and start a real-time one-to-one conversation.
        </p>

        {/* Display registration error */}
        {error && <div className="error-banner">{error}</div>}

        {/* Registration form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            Name
            <input
              name="name"
              value={form.name}
              onChange={updateField}
              minLength={2}
              required
            />
          </label>

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
              minLength={6}
              required
            />
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