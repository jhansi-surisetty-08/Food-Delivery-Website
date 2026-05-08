import axios from "axios";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001";
const STORAGE_KEY = "admin-auth-session";
const DEFAULT_TIMEOUT_MINUTES = 30;
const ACTIVITY_EVENTS = ["click", "keydown", "mousemove", "scroll", "touchstart"];

const readStoredSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

const persistSession = (session) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEY);
};

const isExpired = (expiresAt) => {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const timeoutRef = useRef(null);
  const sessionRef = useRef(null);

  const saveSession = (payload) => {
    const nextSession = {
      token: payload.token,
      expiresAt: payload.expiresAt,
      sessionTimeoutMinutes: payload.sessionTimeoutMinutes || DEFAULT_TIMEOUT_MINUTES,
      user: payload.user,
    };

    sessionRef.current = nextSession;
    setSession(nextSession);
    persistSession(nextSession);
    return nextSession;
  };

  const logout = (message) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    sessionRef.current = null;
    setSession(null);
    clearSession();

    if (message) {
      toast.info(message);
    }
  };

  const resetActivityTimer = () => {
    if (!sessionRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const timeoutMinutes = sessionRef.current.sessionTimeoutMinutes || DEFAULT_TIMEOUT_MINUTES;
    timeoutRef.current = setTimeout(() => {
      logout("Session timed out. Please login again.");
    }, timeoutMinutes * 60 * 1000);
  };

  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use((config) => {
      const activeSession = sessionRef.current;
      if (activeSession?.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${activeSession.token}`;
        config.headers.token = activeSession.token;
      }

      return config;
    });

    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error?.response?.status;
        const requestUrl = error?.config?.url || "";
        const isAuthEndpoint =
          requestUrl.includes("/api/admin/register") ||
          requestUrl.includes("/api/admin/login") ||
          requestUrl.includes("/api/admin/forgot-password") ||
          requestUrl.includes("/api/admin/reset-password");

        if (sessionRef.current?.token && !isAuthEndpoint && (status === 401 || status === 403)) {
          logout("Admin session expired. Please login again.");
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  useEffect(() => {
    const hydrateSession = async () => {
      const storedSession = readStoredSession();
      if (!storedSession || !storedSession.token || isExpired(storedSession.expiresAt)) {
        clearSession();
        setIsHydrating(false);
        return;
      }

      sessionRef.current = storedSession;
      setSession(storedSession);

      try {
        const response = await axios.get(`${API_URL}/api/admin/session`, {
          headers: {
            Authorization: `Bearer ${storedSession.token}`,
            token: storedSession.token,
          },
        });

        if (response.data?.success) {
          saveSession({
            ...storedSession,
            user: response.data.user,
          });
        } else {
          logout();
        }
      } catch (error) {
        console.log(error);
        logout();
      } finally {
        setIsHydrating(false);
      }
    };

    hydrateSession();
  }, []);

  useEffect(() => {
    if (!session?.token) {
      return undefined;
    }

    resetActivityTimer();

    const handleActivity = () => resetActivityTimer();
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, handleActivity));

    const interval = setInterval(() => {
      if (sessionRef.current?.expiresAt && isExpired(sessionRef.current.expiresAt)) {
        logout("Admin session expired. Please login again.");
      }
    }, 30000);

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [session]);

  const login = async (credentials) => {
    const response = await axios.post(`${API_URL}/api/admin/login`, credentials);
    if (response.data?.success) {
      saveSession(response.data);
      resetActivityTimer();
    }

    return response.data;
  };

  const signup = async (payload) => {
    const response = await axios.post(`${API_URL}/api/admin/register`, payload);
    if (response.data?.success) {
      saveSession(response.data);
      resetActivityTimer();
    }

    return response.data;
  };

  const requestPasswordReset = async (identifier) => {
    const response = await axios.post(`${API_URL}/api/admin/forgot-password`, { identifier });
    return response.data;
  };

  const resetPassword = async (payload) => {
    const response = await axios.post(`${API_URL}/api/admin/reset-password`, payload);
    return response.data;
  };

  return (
    <AuthContext.Provider
      value={{
        apiUrl: API_URL,
        session,
        user: session?.user || null,
        token: session?.token || "",
        isAuthenticated: Boolean(session?.token),
        isHydrating,
        signup,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
