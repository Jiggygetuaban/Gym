import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo } from "react";
import {
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatCard } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import { router } from "expo-router";

interface PR {
  exerciseName: string;
  maxWeight: number;
  date: number;
}

function computePRs(sessions: ReturnType<typeof useStorage>["sessions"]): PR[] {
  const map = new Map<string, PR>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.completed) continue;
        const w = parseFloat(set.weight);
        if (isNaN(w) || w <= 0) continue;
        const existing = map.get(ex.exercise.id);
        if (!existing || w > existing.maxWeight) {
          map.set(ex.exercise.id, {
            exerciseName: ex.exercise.name,
            maxWeight: w,
            date: s.startedAt,
          });
        }
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => b.maxWeight - a.maxWeight);
}

function getTotalVolume(sessions: ReturnType<typeof useStorage>["sessions"]) {
  return sessions.reduce((a, s) => a + s.totalVolume, 0);
}

function getBestStreak(sessions: ReturnType<typeof useStorage>["sessions"]) {
  if (!sessions.length) return 0;
  const days = [
    ...new Set(
      sessions.map((s) => {
        const d = new Date(s.startedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    ),
  ].sort((a, b) => a - b);
  let best = 1, cur = 1;
  for (let i = 1; i < days.length; i++) {
    if (days[i] - days[i - 1] === 86400000) {
      cur++;
      best = Math.max(best, cur);
    } else {
      cur = 1;
    }
  }
  return best;
}

function ProfileField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  secureTextEntry,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "email-address";
  secureTextEntry?: boolean;
}) {
  const colors = useColors();

  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={keyboardType === "email-address" ? "none" : "words"}
        autoCorrect={false}
        style={[
          styles.input,
          {
            backgroundColor: colors.input,
            borderColor: colors.border,
            borderRadius: colors.radius - 2,
            color: colors.foreground,
          },
        ]}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions } = useStorage();
  const { user, logout, updateProfile, uploadProfilePhoto, removeProfilePhoto } =
    useAuth();
  const [editOpen, setEditOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [passwordConfirmation, setPasswordConfirmation] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const [formError, setFormError] = React.useState("");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const prs = useMemo(() => computePRs(sessions), [sessions]);
  const totalVolume = useMemo(() => getTotalVolume(sessions), [sessions]);
  const bestStreak = useMemo(() => getBestStreak(sessions), [sessions]);

  const totalVolumeLabel =
    totalVolume >= 1000
      ? `${(totalVolume / 1000).toFixed(1)}t`
      : `${totalVolume.toFixed(0)}kg`;

  function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  function openEditProfile() {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setCurrentPassword("");
    setPassword("");
    setPasswordConfirmation("");
    setFormError("");
    setEditOpen(true);
  }

  async function handleSaveProfile() {
    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    if (password && password !== passwordConfirmation) {
      setFormError("New passwords do not match.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim(),
        currentPassword,
        password,
        passwordConfirmation,
      });
      setEditOpen(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Profile update failed");
    } finally {
      setSaving(false);
    }
  }

  async function handlePickPhoto() {
    setFormError("");
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Gallery permission is required to choose a profile photo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      await uploadProfilePhoto(result.assets[0]);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Profile photo upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleRemovePhoto() {
    setUploadingPhoto(true);
    setFormError("");
    try {
      await removeProfilePhoto();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Profile photo removal failed");
    } finally {
      setUploadingPhoto(false);
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
          Profile
        </Text>
        <TouchableOpacity onPress={handleLogout} hitSlop={8}>
          <Ionicons name="log-out-outline" size={22} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* User card */}
        {user && (
          <View
            style={[
              styles.userCard,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.primary, borderRadius: 28 },
              ]}
            >
              {user.profile_photo_url ? (
                <Image
                  source={{ uri: user.profile_photo_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {user.name}
              </Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {user.email}
              </Text>
            </View>
            <TouchableOpacity
              onPress={openEditProfile}
              hitSlop={8}
              style={[
                styles.editIconBtn,
                { backgroundColor: colors.muted, borderRadius: 18 },
              ]}
            >
              <Ionicons name="create-outline" size={18} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Overall stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            ALL TIME
          </Text>
          <View style={styles.statsRow}>
            <StatCard label="Workouts" value={String(sessions.length)} accent />
            <StatCard label="Volume" value={totalVolumeLabel} />
            <StatCard label="Best Streak" value={String(bestStreak)} unit="days" />
          </View>
        </View>

        {/* Personal Records */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            PERSONAL RECORDS
          </Text>
          {prs.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Ionicons name="trophy-outline" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Complete workouts to see your personal records
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.prList,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                },
              ]}
            >
              {prs.map((pr, idx) => (
                <View
                  key={pr.exerciseName}
                  style={[
                    styles.prRow,
                    idx < prs.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.prLeft}>
                    <View
                      style={[
                        styles.prRank,
                        {
                          backgroundColor:
                            idx === 0 ? colors.primary + "20" : colors.muted,
                          borderRadius: 6,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.prRankText,
                          {
                            color:
                              idx === 0 ? colors.primary : colors.mutedForeground,
                          },
                        ]}
                      >
                        #{idx + 1}
                      </Text>
                    </View>
                    <Text
                      style={[styles.prName, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {pr.exerciseName}
                    </Text>
                  </View>
                  <Text style={[styles.prWeight, { color: colors.primary }]}>
                    {pr.maxWeight}kg
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Sign out button */}
        <TouchableOpacity
          onPress={handleLogout}
          style={[
            styles.logoutBtn,
            {
              borderColor: colors.destructive + "50",
              borderRadius: colors.radius,
            },
          ]}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={editOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditOpen(false)}
      >
        <View style={[styles.modalRoot, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop: insets.top + 12,
                backgroundColor: colors.card,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity onPress={() => setEditOpen(false)} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.foreground} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Edit Profile
            </Text>
            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              hitSlop={8}
            >
              <Text
                style={[
                  styles.saveText,
                  { color: saving ? colors.mutedForeground : colors.primary },
                ]}
              >
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.modalContent,
              { paddingBottom: insets.bottom + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.avatarPreviewWrap}>
              <View
                style={[
                  styles.avatarLarge,
                  { backgroundColor: colors.primary, borderRadius: 44 },
                ]}
              >
                {user?.profile_photo_url ? (
                  <Image
                    source={{ uri: user.profile_photo_url }}
                    style={styles.avatarLargeImage}
                  />
                ) : (
                  <Text
                    style={[
                      styles.avatarLargeText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {(name || user?.name || "U").charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.photoActions}>
                <TouchableOpacity
                  onPress={handlePickPhoto}
                  disabled={uploadingPhoto}
                  style={[
                    styles.photoBtn,
                    {
                      backgroundColor: colors.primary,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  {uploadingPhoto ? (
                    <ActivityIndicator color={colors.primaryForeground} />
                  ) : (
                    <>
                      <Ionicons
                        name="images-outline"
                        size={16}
                        color={colors.primaryForeground}
                      />
                      <Text
                        style={[
                          styles.photoBtnText,
                          { color: colors.primaryForeground },
                        ]}
                      >
                        Choose Photo
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
                {user?.profile_photo_url ? (
                  <TouchableOpacity
                    onPress={handleRemovePhoto}
                    disabled={uploadingPhoto}
                    style={[
                      styles.removePhotoBtn,
                      {
                        borderColor: colors.border,
                        borderRadius: colors.radius,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.removePhotoText,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {formError ? (
              <View
                style={[
                  styles.errorBox,
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
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {formError}
                </Text>
              </View>
            ) : null}

            <ProfileField
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
            />
            <ProfileField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
            />

            <Text style={[styles.passwordHint, { color: colors.mutedForeground }]}>
              Leave password fields blank to keep your current password.
            </Text>
            <ProfileField
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Required for password change"
              secureTextEntry
            />
            <ProfileField
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
            />
            <ProfileField
              label="Confirm new password"
              value={passwordConfirmation}
              onChangeText={setPasswordConfirmation}
              placeholder="Repeat new password"
              secureTextEntry
            />

            <TouchableOpacity
              onPress={handleSaveProfile}
              disabled={saving}
              style={[
                styles.primaryBtn,
                {
                  backgroundColor: saving ? colors.muted : colors.primary,
                  borderRadius: colors.radius,
                },
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.primaryBtnText,
                    { color: colors.primaryForeground },
                  ]}
                >
                  Save Changes
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold" },
  content: { padding: 20, paddingBottom: 120, gap: 28 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  avatar: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 56, height: 56 },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
  editIconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  emptyCard: { padding: 24, alignItems: "center", gap: 12, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  prList: { borderWidth: 1, overflow: "hidden" },
  prRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, gap: 12 },
  prLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  prRank: { paddingHorizontal: 7, paddingVertical: 3 },
  prRankText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  prName: { fontSize: 15, fontFamily: "Inter_500Medium", flex: 1 },
  prWeight: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  modalContent: { padding: 20, gap: 14 },
  avatarPreviewWrap: { alignItems: "center", paddingVertical: 8 },
  avatarLarge: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarLargeImage: { width: 88, height: 88 },
  avatarLargeText: {
    fontSize: 36,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  photoActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  photoBtn: {
    minHeight: 42,
    minWidth: 142,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 14,
  },
  photoBtnText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  removePhotoBtn: {
    minHeight: 42,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  removePhotoText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    borderWidth: 1,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  passwordHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    marginTop: 4,
  },
  primaryBtn: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
