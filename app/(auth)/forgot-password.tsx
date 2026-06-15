import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Step = "email" | "reset" | "done";

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  editable = true,
  keyboardType = "default",
  secureTextEntry,
  maxLength,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  editable?: boolean;
  keyboardType?: "default" | "email-address" | "number-pad";
  secureTextEntry?: boolean;
  maxLength?: number;
}) {
  const colors = useColors();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputWrap,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            borderRadius: colors.radius - 2,
            opacity: editable ? 1 : 0.7,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={colors.mutedForeground} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.input, { color: colors.foreground }]}
          editable={editable}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={maxLength}
        />
      </View>
    </View>
  );
}

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { forgotPassword, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const responseMessage = await forgotPassword(email.trim());
      setMessage(responseMessage);
      setStep("reset");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Password reset request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (code.trim().length !== 6) {
      setError("Enter the 6 digit reset code.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== passwordConfirmation) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const responseMessage = await resetPassword(
        email.trim(),
        code.trim(),
        password,
        passwordConfirmation
      );
      setMessage(responseMessage);
      setStep("done");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Password reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 40 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Ionicons name="arrow-back" size={24} color={colors.foreground} />
          </TouchableOpacity>

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
            <Text style={[styles.title, { color: colors.foreground }]}>
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {step === "email"
                ? "Enter your email and we will send a 6 digit reset code."
                : step === "reset"
                  ? "Enter the reset code and choose a new password."
                  : "Your password has been updated."}
            </Text>

            {message ? (
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: colors.success + "16",
                    borderColor: colors.success + "40",
                    borderRadius: 8,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={colors.success}
                />
                <Text style={[styles.infoText, { color: colors.success }]}>
                  {message}
                </Text>
              </View>
            ) : null}

            {error ? (
              <View
                style={[
                  styles.infoBox,
                  {
                    backgroundColor: colors.destructive + "18",
                    borderColor: colors.destructive + "40",
                    borderRadius: 8,
                  },
                ]}
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.destructive}
                />
                <Text style={[styles.infoText, { color: colors.destructive }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            <Field
              label="Email"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              editable={step !== "done"}
              keyboardType="email-address"
            />

            {step !== "email" ? (
              <>
                <Field
                  label="Reset Code"
                  icon="keypad-outline"
                  value={code}
                  onChangeText={setCode}
                  placeholder="6 digit code"
                  editable={step !== "done"}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <Field
                  label="New Password"
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Min. 6 characters"
                  editable={step !== "done"}
                  secureTextEntry
                />
                <Field
                  label="Confirm Password"
                  icon="lock-closed-outline"
                  value={passwordConfirmation}
                  onChangeText={setPasswordConfirmation}
                  placeholder="Repeat new password"
                  editable={step !== "done"}
                  secureTextEntry
                />
              </>
            ) : null}

            {step === "done" ? (
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/login")}
                style={[
                  styles.submitBtn,
                  { backgroundColor: colors.primary, borderRadius: colors.radius },
                ]}
              >
                <Text
                  style={[
                    styles.submitText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Back to Sign In
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={step === "email" ? handleSendCode : handleResetPassword}
                disabled={loading}
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: loading ? colors.muted : colors.primary,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text
                    style={[
                      styles.submitText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {step === "email" ? "Send Code" : "Reset Password"}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 24, gap: 24 },
  card: { padding: 24, gap: 16, borderWidth: 1 },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  fieldWrap: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  submitBtn: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
