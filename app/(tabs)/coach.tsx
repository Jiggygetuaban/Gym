import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API_BASE, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type SuggestionType = "workout" | "diet" | "general";

const PROMPTS: Record<SuggestionType, string[]> = {
  workout: [
    "Suggest my next workout based on my recent training.",
    "Build a 45 minute upper body session.",
    "How should I improve strength this week?",
  ],
  diet: [
    "Suggest a simple high protein day of eating.",
    "What should I eat before and after training?",
    "Give me diet tips for losing fat while training.",
  ],
  general: [
    "How can I recover better between workouts?",
    "Give me a balanced weekly fitness plan.",
    "What habits should I focus on this month?",
  ],
};

function getErrorMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const maybeError = data as { error?: unknown; message?: unknown };
    if (typeof maybeError.error === "string") return maybeError.error;
    if (typeof maybeError.message === "string") return maybeError.message;
  }

  return fallback;
}

export default function CoachScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [type, setType] = useState<SuggestionType>("workout");
  const [prompt, setPrompt] = useState(PROMPTS.workout[0]);
  const [suggestion, setSuggestion] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  function handleTypeChange(nextType: SuggestionType) {
    setType(nextType);
    setPrompt(PROMPTS[nextType][0]);
    setSuggestion("");
    setError("");
  }

  async function handleAsk() {
    if (!prompt.trim()) {
      setError("Ask for a workout, diet, or recovery suggestion.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/ai/suggestions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ type, prompt: prompt.trim() }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(getErrorMessage(data, "AI suggestion failed"));
      }

      setSuggestion(data.suggestion ?? "No suggestion was generated.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "AI suggestion failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: topInset + 16,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          AI Coach
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.modeRow}>
          {(["workout", "diet", "general"] as const).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => handleTypeChange(item)}
              style={[
                styles.modeBtn,
                {
                  backgroundColor: type === item ? colors.primary : colors.card,
                  borderColor: type === item ? colors.primary : colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Text
                style={[
                  styles.modeText,
                  {
                    color:
                      type === item
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            ASK YOUR COACH
          </Text>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask for workout or diet guidance..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
            style={[
              styles.input,
              {
                color: colors.foreground,
                backgroundColor: colors.input,
                borderRadius: colors.radius - 2,
              },
            ]}
          />

          <View style={styles.promptList}>
            {PROMPTS[type].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setPrompt(item)}
                style={[
                  styles.promptChip,
                  { backgroundColor: colors.muted, borderRadius: 18 },
                ]}
              >
                <Text
                  style={[
                    styles.promptChipText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleAsk}
            disabled={loading}
            style={[
              styles.askBtn,
              {
                backgroundColor: loading ? colors.muted : colors.primary,
                borderRadius: colors.radius,
              },
            ]}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Feather name="send" size={17} color={colors.primaryForeground} />
                <Text
                  style={[
                    styles.askBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Get Suggestion
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.destructive + "18",
                borderColor: colors.destructive + "40",
                borderRadius: colors.radius,
              },
            ]}
          >
            <Feather name="alert-circle" size={17} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          </View>
        ) : null}

        {suggestion ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.label, { color: colors.mutedForeground }]}>
              SUGGESTION
            </Text>
            <Text style={[styles.suggestionText, { color: colors.foreground }]}>
              {suggestion}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  content: { padding: 20, paddingBottom: 120, gap: 16 },
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 11,
    borderWidth: 1,
  },
  modeText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  card: { padding: 16, gap: 14, borderWidth: 1 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  input: {
    minHeight: 110,
    padding: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  promptList: { gap: 8 },
  promptChip: { paddingHorizontal: 12, paddingVertical: 9 },
  promptChipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  askBtn: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  askBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 9,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  suggestionText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
});
