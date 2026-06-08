import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions } = useStorage();
  const { user, logout } = useAuth();
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
              <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.foreground }]}>
                {user.name}
              </Text>
              <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
                {user.email}
              </Text>
            </View>
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
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 18, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  userEmail: { fontSize: 13, fontFamily: "Inter_400Regular" },
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
});
