import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { avatarOptions } from "../../utils/avatarOptions";
import "./Auth.css";

const getErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData?.message) {
    return responseData.message;
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

const PasswordToggleIcon = ({ isVisible }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M2 12C4.7 7.8 8.1 5.7 12 5.7S19.3 7.8 22 12c-2.7 4.2-6.1 6.3-10 6.3S4.7 16.2 2 12Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    {isVisible ? null : (
      <path
        d="M4 4L20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    )}
  </svg>
);

const AdminSignup = () => {
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    avatar: avatarOptions[0].id,
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        avatar: form.avatar,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      if (data?.success) {
        toast.success("Admin account created successfully");
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to create admin account"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-wide">
        <div className="auth-copy">
          <p className="auth-eyebrow">Admin Portal</p>
          <h1>Create an admin account</h1>
          <p className="auth-description">
            Register a new admin profile with your name, email, phone number, and password.
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Admin Name</span>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter admin name"
              required
            />
          </label>

          <label>
            <span>Admin Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              required
            />
          </label>

          <label>
            <span>Phone</span>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Optional phone number"
            />
          </label>

          <div className="auth-avatar-picker">
            <p>Choose your avatar</p>
            <div className="auth-avatar-grid">
              {avatarOptions.map((avatarOption) => (
                <button
                  key={avatarOption.id}
                  type="button"
                  className={`auth-avatar-option ${form.avatar === avatarOption.id ? "selected" : ""}`}
                  style={{ background: avatarOption.gradient }}
                  onClick={() => setForm((prev) => ({ ...prev, avatar: avatarOption.id }))}
                  aria-label={`Choose avatar ${avatarOption.id}`}
                >
                  <span>{avatarOption.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          <label>
            <span>Password</span>
            <div className="password-field">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <PasswordToggleIcon isVisible={showPassword} />
              </button>
            </div>
          </label>

          <label>
            <span>Confirm Password</span>
            <div className="password-field">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                <PasswordToggleIcon isVisible={showConfirmPassword} />
              </button>
            </div>
          </label>

          <button type="submit" disabled={submitting}>
            {submitting ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-links">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
