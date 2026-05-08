import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
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

const AdminForgotPassword = () => {
  const navigate = useNavigate();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    identifier: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRequestOtp = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await requestPasswordReset(form.identifier.trim());
      if (data?.success) {
        setOtpRequested(true);
        setDevOtp(data.otp || "");
        toast.success(data.message || "OTP sent successfully");
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to generate OTP"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await resetPassword({
        identifier: form.identifier.trim(),
        otp: form.otp.trim(),
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      });

      if (data?.success) {
        toast.success("Password updated. Please login again.");
        navigate("/login", { replace: true });
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "Unable to reset password"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-card auth-card-wide">
        <div className="auth-copy">
          <p className="auth-eyebrow">Password Recovery</p>
          <h1>Reset admin access securely</h1>
          <p className="auth-description">
            Enter the admin email or phone number, verify the OTP, and set a new password.
          </p>
        </div>

        <form className="auth-form" onSubmit={otpRequested ? handleResetPassword : handleRequestOtp}>
          <label>
            <span>Email / Phone</span>
            <input
              type="text"
              name="identifier"
              value={form.identifier}
              onChange={handleChange}
              placeholder="admin@example.com or phone"
              required
            />
          </label>

          {otpRequested ? (
            <>
              <label>
                <span>OTP Verification</span>
                <input
                  type="text"
                  name="otp"
                  value={form.otp}
                  onChange={handleChange}
                  placeholder="Enter 6-digit OTP"
                  required
                />
              </label>

              <label>
                <span>New Password</span>
                <div className="password-field">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={form.newPassword}
                    onChange={handleChange}
                    placeholder="Enter a new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                    title={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    <PasswordToggleIcon isVisible={showNewPassword} />
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
                    placeholder="Confirm your new password"
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
            </>
          ) : null}

          <button type="submit" disabled={submitting}>
            {submitting ? "Please wait..." : otpRequested ? "Update Password" : "Send OTP"}
          </button>
        </form>

        {devOtp ? (
          <div className="auth-dev-note">
            Development OTP: <strong>{devOtp}</strong>
          </div>
        ) : null}

        <div className="auth-links">
          <Link to="/login">Back to Login</Link>
          <Link to="/signup">Create Admin Account</Link>
        </div>
      </div>
    </div>
  );
};

export default AdminForgotPassword;
