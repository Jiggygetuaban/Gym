import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import React, { useMemo } from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SessionCard, StatCard } from "@/components";
import { useAuth } from "@/context/AuthContext";
import { useStorage } from "@/context/StorageContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatTimer(s: number) {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function getStreak(sessions: { startedAt: number }[]) {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let cursor = today.getTime();
  for (const s of sorted) {
    const d = new Date(s.startedAt);
    d.setHours(0, 0, 0, 0);
    if (d.getTime() === cursor) {
      streak++;
      cursor -= 86400000;
    } else if (d.getTime() < cursor) {
      break;
    }
  }
  return streak;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { sessions } = useStorage();
  const { activeWorkout, elapsedSeconds, startWorkout } = useWorkout();

  const weekStart = useMemo(() => getWeekStart(), []);
  const weekSessions = useMemo(
    () => sessions.filter((s) => s.startedAt >= weekStart),
    [sessions, weekStart]
  );
  const weekVolume = useMemo(
    () => weekSessions.reduce((acc, s) => acc + s.totalVolume, 0),
    [weekSessions]
  );
  const streak = useMemo(() => getStreak(sessions), [sessions]);
  const recentSessions = useMemo(() => sessions.slice(0, 5), [sessions]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  function handleStartEmpty() {
    startWorkout("Quick Workout");
    router.push("/workout/active");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: topInset + 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                {getGreeting()}
              </Text>
              {user?.name ? (
                <Text
                  style={[styles.greetingName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {user.name}
                </Text>
              ) : null}
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Let&apos;s train
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/profile" as Href)}
            activeOpacity={0.8}
            hitSlop={12}
            style={[
              styles.avatarButton,
              { borderRadius: 28 },
            ]}
          >
            <View
              style={[
                styles.avatarWrap,
                { backgroundColor: colors.primary, borderRadius: 20 },
              ]}
            >
              {user?.profile_photo_url ? (
                <Image
                  source={{ uri: user.profile_photo_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <Ionicons
                  name="person"
                  size={20}
                  color={colors.primaryForeground}
                />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Active workout banner */}
        {activeWorkout && (
          <TouchableOpacity
            onPress={() => router.push("/workout/active")}
            activeOpacity={0.85}
            style={[
              styles.activeBanner,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
              },
            ]}
          >
            <View style={styles.activeBannerLeft}>
              <View style={[styles.pulseDot, { backgroundColor: colors.primaryForeground }]} />
              <View>
                <Text style={[styles.activeBannerTitle, { color: colors.primaryForeground }]}>
                  {activeWorkout.name}
                </Text>
                <Text style={[styles.activeBannerTime, { color: colors.primaryForeground + "CC" }]}>
                  {formatTimer(elapsedSeconds)} elapsed
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.primaryForeground} />
          </TouchableOpacity>
        )}

        {/* Weekly Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            THIS WEEK
          </Text>
          <View style={styles.statsRow}>
            <StatCard
              label="Workouts"
              value={String(weekSessions.length)}
              accent
            />
            <StatCard
              label="Volume"
              value={weekVolume >= 1000 ? (weekVolume / 1000).toFixed(1) : weekVolume.toFixed(0)}
              unit={weekVolume >= 1000 ? "t" : "kg"}
            />
            <StatCard label="Streak" value={String(streak)} unit="days" />
          </View>
        </View>

        {/* Start workout */}
        {!activeWorkout && (
          <TouchableOpacity
            onPress={handleStartEmpty}
            activeOpacity={0.85}
            style={[
              styles.startBtn,
              {
                backgroundColor: colors.primary,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Ionicons
              name="add-circle"
              size={22}
              color={colors.primaryForeground}
            />
            <Text
              style={[styles.startBtnText, { color: colors.primaryForeground }]}
            >
              Start Empty Workout
            </Text>
          </TouchableOpacity>
        )}

        {/* Recent sessions */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
            RECENT
          </Text>
          {recentSessions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <Ionicons name="barbell-outline" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No workouts yet. Start your first session!
              </Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {recentSessions.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onPress={() => router.push(`/session/${s.id}` as Href)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 16,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  greeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  greetingName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  avatarButton: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: 40, height: 40 },
  activeBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  activeBannerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4 },
  activeBannerTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  activeBannerTime: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { gap: 12 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  statsRow: { flexDirection: "row", gap: 10 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  startBtnText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  emptyCard: {
    padding: 24,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  sessionList: { gap: 10 },
});
