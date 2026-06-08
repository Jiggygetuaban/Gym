import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
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
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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

  async function saveTemplate(template: WorkoutTemplate) {
    const updated = [
      ...templates.filter((t) => t.id !== template.id),
      template,
    ];
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  }

  async function deleteTemplate(id: string) {
    const updated = templates.filter((t) => t.id !== id);
    setTemplates(updated);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
  }

  async function saveSession(session: WorkoutSession) {
    const updated = [session, ...sessions];
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
  }

  async function deleteSession(id: string) {
    const updated = sessions.filter((s) => s.id !== id);
    setSessions(updated);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
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
