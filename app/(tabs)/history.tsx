import { Ionicons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SessionCard } from "@/components";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import { WorkoutSession } from "@/types";

function getWeekLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);
  const sessionWeekStart = new Date(d);
  sessionWeekStart.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
  sessionWeekStart.setHours(0, 0, 0, 0);
  const diffWeeks = Math.round((weekStart.getTime() - sessionWeekStart.getTime()) / (7 * 86400000));
  if (diffWeeks === 0) return "This Week";
  if (diffWeeks === 1) return "Last Week";
  return sessionWeekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: sessionWeekStart.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  }) + " week";
}

export default function HistoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { sessions, deleteSession } = useStorage();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const sections = useMemo(() => {
    const groups = new Map<string, WorkoutSession[]>();
    for (const s of sessions) {
      const key = getWeekLabel(s.startedAt);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(s);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({
      title,
      data,
    }));
  }, [sessions]);

  function handleDelete(id: string, name: string) {
    Alert.alert("Delete Session", `Remove "${name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteSession(id),
      },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          History
        </Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: colors.muted, borderRadius: colors.radius },
            ]}
          >
            <Ionicons
              name="time-outline"
              size={36}
              color={colors.mutedForeground}
            />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No workouts yet
          </Text>
          <Text
            style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
          >
            Complete your first workout to see it here
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text
              style={[styles.sectionHeader, { color: colors.mutedForeground }]}
            >
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => (
            <SessionCard
              session={item}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          SectionSeparatorComponent={() => <View style={styles.sectionSep} />}
        />
      )}
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
  listContent: { padding: 20, paddingBottom: 120 },
  sectionHeader: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
    marginTop: 4,
  },
  separator: { height: 10 },
  sectionSep: { height: 20 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
