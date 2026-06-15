import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { API_BASE, useAuth } from "@/context/AuthContext";
import { WorkoutSession, WorkoutTemplate } from "@/types";

interface StorageContextType {
  templates: WorkoutTemplate[];
  sessions: WorkoutSession[];
  saveTemplate: (template: WorkoutTemplate) => Promise<void>;
  deleteTemplate: (id: string) => Promise<void>;
  saveSession: (session: WorkoutSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  isLoading: boolean;
}

const StorageContext = createContext<StorageContextType | null>(null);

const TEMPLATES_KEY = "@gymlog/templates";
const SESSIONS_KEY = "@gymlog/sessions";

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const { token, isLoading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (token) {
        syncFromApi(token);
      } else {
        setTemplates([]);
        setSessions([]);
        setIsLoading(false);
      }
    }
  }, [authLoading, token]);

  async function loadData() {
    try {
      const [tmplData, sessData] = await Promise.all([
        AsyncStorage.getItem(TEMPLATES_KEY),
        AsyncStorage.getItem(SESSIONS_KEY),
      ]);
      if (tmplData) setTemplates(JSON.parse(tmplData));
      if (sessData) setSessions(JSON.parse(sessData));
    } catch (_) {
    } finally {
      setIsLoading(false);
    }
  }

  async function authedFetch(path: string, init?: RequestInit) {
    if (!token) return null;

    return fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
  }

  async function syncFromApi(activeToken: string) {
    setIsLoading(true);
    try {
      const [templateRes, sessionRes] = await Promise.all([
        fetch(`${API_BASE}/workout-templates`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
        fetch(`${API_BASE}/workout-sessions`, {
          headers: { Authorization: `Bearer ${activeToken}` },
        }),
      ]);

      if (!templateRes.ok || !sessionRes.ok) return;

      const [templateData, sessionData] = await Promise.all([
        templateRes.json(),
        sessionRes.json(),
      ]);
      const apiTemplates = templateData.templates ?? [];
      const apiSessions = sessionData.sessions ?? [];

      setTemplates(apiTemplates);
      setSessions(apiSessions);
      await Promise.all([
        AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(apiTemplates)),
        AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(apiSessions)),
      ]);
    } catch (_) {
    } finally {
      setIsLoading(false);
    }
  }

  async function saveTemplate(template: WorkoutTemplate) {
    const updated = [
      ...templates.filter((t) => t.id !== template.id),
      template,
    ];
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
    await authedFetch("/workout-templates", {
      method: "POST",
      body: JSON.stringify(template),
    });
  }

  async function deleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
    await authedFetch(`/workout-templates/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  async function saveSession(session: WorkoutSession) {
    const updated = [session, ...sessions];
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    await authedFetch("/workout-sessions", {
      method: "POST",
      body: JSON.stringify(session),
    });
  }

  async function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
    await authedFetch(`/workout-sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  }

  return (
    <StorageContext.Provider
      value={{
        templates,
        sessions,
        saveTemplate,
        deleteTemplate,
        saveSession,
        deleteSession,
        isLoading,
      }}
    >
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error("useStorage must be used within StorageProvider");
  return ctx;
}
