import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import PropTypes from "prop-types";
import "./Auth.css";
import { StoreContext } from "../../components/context/StoreContext";
import { avatarOptions } from "../../utils/avatarOptions";

const STORAGE_PREFERENCE_KEY = "rememberMe";

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
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
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

const persistUserSession = (responseData, rememberMe, setToken, setRole, setUserInfo) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  const otherStorage = rememberMe ? sessionStorage : localStorage;
  const nextUserInfo = {
    name: responseData.name,
    email: responseData.email,
    avatar: responseData.avatar,
    role: responseData.role || "user",
  };

  setToken(responseData.token);
  setRole(responseData.role || "user");
  setUserInfo(nextUserInfo);

  otherStorage.removeItem("token");
  otherStorage.removeItem("role");
  otherStorage.removeItem("userInfo");

  storage.setItem("token", responseData.token);
  storage.setItem("role", responseData.role || "user");
  storage.setItem("userInfo", JSON.stringify(nextUserInfo));
  localStorage.setItem(STORAGE_PREFERENCE_KEY, rememberMe ? "true" : "false");
};

const Auth = ({ defaultMode = "signup" }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { url, setToken, setRole, setUserInfo } = useContext(StoreContext);
  const isDefaultLogin = defaultMode === "login";

  const [mode, setMode] = useState(isDefaultLogin ? "login" : "signup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    avatar: avatarOptions[0].id,
  });
  const [resetData, setResetData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [rememberMe, setRememberMe] = useState(() => {
    const saved = localStorage.getItem(STORAGE_PREFERENCE_KEY);
    return saved !== "false";
  });
  const [otpRequested, setOtpRequested] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const redirectTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);

  const heading = useMemo(() => {
    if (mode === "forgot") return "Reset password";
    return mode === "signup" ? "Create account" : "Sign in";
  }, [mode]);

  const subText = useMemo(() => {
    if (mode === "forgot") return "Verify your email with OTP and set a new password";
    return mode === "signup"
      ? "Start by creating your account"
      : "Sign in with your account";
  }, [mode]);

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    clearMessages();
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleResetChange = (event) => {
    const { name, value } = event.target;
    clearMessages();
    setResetData((previous) => ({ ...previous, [name]: value }));
  };

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authError = params.get("authError");
    const googleAuth = params.get("googleAuth");
    const token = params.get("token");

    if (authError) {
      setErrorMessage(authError);
      navigate(location.pathname, { replace: true });
      return;
    }

    if (googleAuth === "success" && token) {
      const payload = {
        token,
        role: params.get("role") || "user",
        name: params.get("name") || "",
        email: params.get("email") || "",
        avatar: params.get("avatar") || avatarOptions[0].id,
      };

      persistUserSession(payload, rememberMe, setToken, setRole, setUserInfo);
      navigate("/", { replace: true });
    }
  }, [location.pathname, location.search, navigate, rememberMe, setRole, setToken, setUserInfo]);

  const validateClientInput = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (mode === "signup" && formData.name.trim().length < 2) {
      return "Invalid name";
    }

    if (!emailRegex.test(formData.email)) {
      return "Invalid email";
    }

    if (formData.password.length < 8) {
      return "Invalid password";
    }

    return "";
  };

  const isAccountMissingResponse = (responseData, statusCode) => {
    const message = (responseData?.message || "").toLowerCase();
    return statusCode === 404 || message.includes("account not found");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearMessages();

    const clientValidationMessage = validateClientInput();
    if (clientValidationMessage) {
      setErrorMessage(clientValidationMessage);
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === "signup" ? "/api/user/register" : "/api/user/login";
      const payload =
        mode === "signup"
          ? {
              name: formData.name.trim(),
              email: formData.email.trim(),
              password: formData.password,
              avatar: formData.avatar,
            }
          : {
              email: formData.email.trim(),
              password: formData.password,
            };

      const response = await axios.post(`${url}${endpoint}`, payload);

      if (!response.data.success) {
        if (mode === "login" && isAccountMissingResponse(response.data)) {
          setMode("signup");
          setErrorMessage("No account found. Please create one.");
          return;
        }
        setErrorMessage(mode === "login" ? "Invalid credentials" : (response.data.message || "Signup failed"));
        return;
      }

      if (mode === "signup") {
        setSuccessMessage("Account created successfully. Redirecting...");
        redirectTimeoutRef.current = setTimeout(() => {
          persistUserSession(response.data, true, setToken, setRole, setUserInfo);
          navigate("/");
        }, 1000);
        return;
      }

      persistUserSession(response.data, rememberMe, setToken, setRole, setUserInfo);
      navigate("/");
    } catch (error) {
      const statusCode = error?.response?.status;
      const responseData = error?.response?.data;
      if (mode === "login" && isAccountMissingResponse(responseData, statusCode)) {
        setMode("signup");
        setErrorMessage("No account found. Please create one.");
        return;
      }
      setErrorMessage(getErrorMessage(error, mode === "login" ? "Invalid credentials" : "Signup failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      if (!otpRequested) {
        const response = await axios.post(`${url}/api/user/forgot-password`, {
          email: resetData.email.trim(),
        });
        setOtpRequested(true);
        setDevOtp(response.data.otp || "");
        setSuccessMessage(response.data.message || "OTP sent successfully");
      } else {
        const response = await axios.post(`${url}/api/user/reset-password`, {
          email: resetData.email.trim(),
          otp: resetData.otp.trim(),
          newPassword: resetData.newPassword,
          confirmPassword: resetData.confirmPassword,
        });
        setSuccessMessage(response.data.message || "Password reset successful");
        setOtpRequested(false);
        setDevOtp("");
        setResetData({
          email: "",
          otp: "",
          newPassword: "",
          confirmPassword: "",
        });
        setMode("login");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to process password reset"));
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!errorMessage) return;
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setErrorMessage(""), 3000);
    return () => {
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [errorMessage]);

  const switchMode = (targetMode) => {
    setMode(targetMode);
    setOtpRequested(false);
    setDevOtp("");
    clearMessages();
  };

  const startGoogleAuth = (googleMode) => {
    localStorage.setItem(STORAGE_PREFERENCE_KEY, rememberMe ? "true" : "false");
    window.location.href = `${url}/api/user/auth/google?mode=${googleMode}`;
  };

  return (
    <div className="auth-page">
      {errorMessage ? (
        <div className="auth-toast" role="alert">
          {errorMessage}
        </div>
      ) : null}
      <div className="auth-card">
        <h1>{heading}</h1>
        <p className="auth-subtext">{subText}</p>

        {mode !== "forgot" ? (
          <div className="auth-toggle">
            <button
              type="button"
              className={mode === "signup" ? "active" : ""}
              onClick={() => switchMode("signup")}
            >
              Sign Up
            </button>
            <button
              type="button"
              className={mode === "login" ? "active" : ""}
              onClick={() => switchMode("login")}
            >
              Sign In
            </button>
          </div>
        ) : null}

        {mode === "forgot" ? (
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={resetData.email}
              onChange={handleResetChange}
              required
            />

            {otpRequested ? (
              <>
                <input
                  type="text"
                  name="otp"
                  placeholder="OTP"
                  value={resetData.otp}
                  onChange={handleResetChange}
                  required
                />

                <div className="auth-password">
                  <input
                    type={showResetPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder="New password"
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowResetPassword((prev) => !prev)}
                    aria-label={showResetPassword ? "Hide password" : "Show password"}
                  >
                    <PasswordToggleIcon isVisible={showResetPassword} />
                  </button>
                </div>

                <div className="auth-password">
                  <input
                    type={showResetConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm password"
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowResetConfirmPassword((prev) => !prev)}
                    aria-label={showResetConfirmPassword ? "Hide password" : "Show password"}
                  >
                    <PasswordToggleIcon isVisible={showResetConfirmPassword} />
                  </button>
                </div>
              </>
            ) : null}

            {successMessage ? <p className="auth-success">{successMessage}</p> : null}
            {devOtp ? <p className="auth-helper">Development OTP: {devOtp}</p> : null}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Please wait..." : otpRequested ? "Reset Password" : "Send OTP"}
            </button>

            <button type="button" className="auth-secondary" onClick={() => switchMode("login")}>
              Back to Sign In
            </button>
          </form>
        ) : (
          <>
            <form className="auth-form" onSubmit={handleSubmit}>
              {mode === "signup" ? (
                <input
                  type="text"
                  name="name"
                  placeholder="Full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              ) : null}

              {mode === "signup" ? (
                <div className="auth-avatar-picker">
                  <p>Choose your avatar</p>
                  <div className="auth-avatar-grid">
                    {avatarOptions.map((avatarOption) => (
                      <button
                        key={avatarOption.id}
                        type="button"
                        className={`auth-avatar-option ${formData.avatar === avatarOption.id ? "selected" : ""}`}
                        style={{ background: avatarOption.gradient }}
                        onClick={() =>
                          setFormData((previous) => ({ ...previous, avatar: avatarOption.id }))
                        }
                        aria-label={`Choose avatar ${avatarOption.id}`}
                      >
                        <span>{avatarOption.emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <div className="auth-password">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <PasswordToggleIcon isVisible={showPassword} />
                </button>
              </div>

              {mode === "login" ? (
                <div className="auth-row">
                  <label className="auth-check">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Remember Me</span>
                  </label>
                  <button
                    type="button"
                    className="auth-link-button"
                    onClick={() => switchMode("forgot")}
                  >
                    Forgot Password?
                  </button>
                </div>
              ) : null}

              {errorMessage ? <p className="auth-error">{errorMessage}</p> : null}
              {successMessage ? <p className="auth-success">{successMessage}</p> : null}

              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Please wait..." : mode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </form>

            <div className="auth-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="auth-google-button"
              onClick={() => startGoogleAuth(mode)}
            >
              <span className="auth-google-icon">G</span>
              {mode === "signup" ? "Sign up with Google" : "Login with Google"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

Auth.propTypes = {
  defaultMode: PropTypes.string,
};

export default Auth;
