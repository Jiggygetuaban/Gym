import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

function getExpoDevHost() {
  const expoConstants = Constants as unknown as {
    expoConfig?: { hostUri?: string };
    manifest?: { debuggerHost?: string };
    manifest2?: { extra?: { expoClient?: { hostUri?: string } } };
  };
  const hostUri =
    expoConstants.expoConfig?.hostUri ??
    expoConstants.manifest2?.extra?.expoClient?.hostUri ??
    expoConstants.manifest?.debuggerHost;

  return hostUri?.split(":")[0];
}

function getApiBase() {
  if (process.env["EXPO_PUBLIC_DOMAIN"]) {
    return `https://${process.env["EXPO_PUBLIC_DOMAIN"]}/api`;
  }

  if (process.env["EXPO_PUBLIC_API_BASE"]) {
    return process.env["EXPO_PUBLIC_API_BASE"];
  }

  const devHost = getExpoDevHost();
  if (devHost && devHost !== "localhost" && devHost !== "127.0.0.1") {
    return `http://${devHost}:8001/api`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:8001/api";
  }

  return "http://localhost:8001/api";
}

export const API_BASE = getApiBase();
const REQUEST_TIMEOUT_MS = 8000;

function getApiOrigin() {
  return API_BASE.replace(/\/api\/?$/, "");
}

function normalizeUser(user: AuthUser | null | undefined): AuthUser | null {
  if (!user) return null;
  const photoUrl = user.profile_photo_url;
  if (!photoUrl) return user;

  try {
    const parsed = new URL(photoUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return {
        ...user,
        profile_photo_url: `${getApiOrigin()}${parsed.pathname}`,
      };
    }
  } catch (_) {
  }

  return user;
}

async function apiFetch(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Backend timed out at ${API_BASE}`);
    }
    throw new Error(`Cannot connect to backend at ${API_BASE}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function readJson(res: Response) {
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
}

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const maybeError = data as {
      error?: unknown;
      message?: unknown;
      errors?: Record<string, string[]>;
    };

    if (typeof maybeError.error === "string") return maybeError.error;
    if (maybeError.errors) {
      const firstError = Object.values(maybeError.errors)[0]?.[0];
      if (firstError) return firstError;
    }
    if (typeof maybeError.message === "string") return maybeError.message;
  }

  return fallback;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  profile_photo_url?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  resetPassword: (
    email: string,
    code: string,
    password: string,
    passwordConfirmation: string
  ) => Promise<string>;
  updateProfile: (data: {
    name: string;
    email: string;
    currentPassword?: string;
    password?: string;
    passwordConfirmation?: string;
  }) => Promise<void>;
  uploadProfilePhoto: (asset: {
    uri: string;
    fileName?: string | null;
    mimeType?: string;
    file?: File;
  }) => Promise<void>;
  removeProfilePhoto: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY = "@gymlog/auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const stored = await AsyncStorage.getItem(TOKEN_KEY);
      if (!stored) return;
      const res = await apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${stored}` },
      });
      if (res.ok) {
        const data = await readJson(res);
        setToken(stored);
        setUser(normalizeUser(data?.user));
      } else {
        await AsyncStorage.removeItem(TOKEN_KEY);
      }
    } catch (_) {
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(getErrorMessage(data, "Login failed"));
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(normalizeUser(data.user));
  }

  async function register(name: string, email: string, password: string) {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await readJson(res);
    if (!res.ok) throw new Error(getErrorMessage(data, "Registration failed"));
    await AsyncStorage.setItem(TOKEN_KEY, data.token);
    setToken(data.token);
    setUser(normalizeUser(data.user));
  }

  async function forgotPassword(email: string) {
    const res = await apiFetch("/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await readJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(data, "Password reset request failed"));
    }
    return data?.message ?? "If that email exists, a reset code has been sent.";
  }

  async function resetPassword(
    email: string,
    code: string,
    password: string,
    passwordConfirmation: string
  ) {
    const res = await apiFetch("/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        code,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });
    const data = await readJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(data, "Password reset failed"));
    }
    return data?.message ?? "Password reset successfully. Please sign in.";
  }

  async function updateProfile(data: {
    name: string;
    email: string;
    currentPassword?: string;
    password?: string;
    passwordConfirmation?: string;
  }) {
    if (!token) throw new Error("You must be signed in to update your profile");

    const res = await apiFetch("/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        currentPassword: data.currentPassword || null,
        password: data.password || null,
        password_confirmation: data.passwordConfirmation || null,
      }),
    });
    const responseData = await readJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(responseData, "Profile update failed"));
    }
    setUser(normalizeUser(responseData.user));
  }

  async function uploadProfilePhoto(asset: {
    uri: string;
    fileName?: string | null;
    mimeType?: string;
    file?: File;
  }) {
    if (!token) throw new Error("You must be signed in to update your profile");

    const formData = new FormData();
    if (asset.file) {
      formData.append("photo", asset.file);
    } else {
      const name = asset.fileName || `profile-photo-${Date.now()}.jpg`;
      const type = asset.mimeType || "image/jpeg";
      formData.append("photo", {
        uri: asset.uri,
        name,
        type,
      } as unknown as Blob);
    }

    const res = await apiFetch("/auth/profile/photo", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await readJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(data, "Profile photo upload failed"));
    }
    setUser(normalizeUser(data.user));
  }

  async function removeProfilePhoto() {
    if (!token) throw new Error("You must be signed in to update your profile");

    const res = await apiFetch("/auth/profile/photo", {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await readJson(res);
    if (!res.ok) {
      throw new Error(getErrorMessage(data, "Profile photo removal failed"));
    }
    setUser(normalizeUser(data.user));
  }

  async function logout() {
    if (token) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (_) {
      }
    }
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        forgotPassword,
        resetPassword,
        updateProfile,
        uploadProfilePhoto,
        removeProfilePhoto,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
