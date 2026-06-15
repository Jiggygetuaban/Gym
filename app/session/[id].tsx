import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";
import { ActiveExercise } from "@/types";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

function formatVolume(kg: number) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${kg.toFixed(0)}kg`;
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getCompletedSetCount(exercises: ActiveExercise[]) {
  return exercises.reduce(
    (total, ex) => total + ex.sets.filter((set) => set.completed).length,
    0
  );
}

export default function SessionDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { sessions } = useStorage();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const session = useMemo(
    () => sessions.find((item) => item.id === id),
    [sessions, id]
  );

  if (!session) {
    return (
      <View
        style={[
          styles.root,
          {
            backgroundColor: colors.background,
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
      >
        <Text style={{ color: colors.mutedForeground }}>
          Workout session not found
        </Text>
      </View>
    );
  }

  const completedSets = getCompletedSetCount(session.exercises);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: topInset + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Ionicons name="arrow-back" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {session.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={session.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={[styles.summaryName, { color: colors.foreground }]}>
              {session.name}
            </Text>
            <Text style={[styles.summaryDate, { color: colors.mutedForeground }]}>
              {formatDate(session.startedAt)}
            </Text>
            <View style={styles.statsRow}>
              <Stat label="Duration" value={formatDuration(session.duration)} />
              <Stat label="Volume" value={formatVolume(session.totalVolume)} />
              <Stat label="Sets" value={String(completedSets)} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.exCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Text style={[styles.exName, { color: colors.foreground }]}>
              {item.exercise.name}
            </Text>
            <Text style={[styles.exSub, { color: colors.mutedForeground }]}>
              {item.exercise.category} - {item.exercise.equipment}
            </Text>
            <View style={styles.setList}>
              {item.sets.map((set, index) => (
                <View
                  key={`${item.id}-${index}`}
                  style={[
                    styles.setRow,
                    { backgroundColor: colors.muted, borderRadius: 8 },
                  ]}
                >
                  <Text style={[styles.setNum, { color: colors.mutedForeground }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.setValue, { color: colors.foreground }]}>
                    {set.weight || "0"} kg x {set.reps || "0"}
                  </Text>
                  <Ionicons
                    name={
                      set.completed
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={18}
                    color={
                      set.completed
                        ? colors.success
                        : colors.mutedForeground
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );

  function Stat({ label, value }: { label: string; value: string }) {
    return (
      <View
        style={[
          styles.stat,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: colors.radius,
          },
        ]}
      >
        <Text style={[styles.statValue, { color: colors.foreground }]}>
          {value}
        </Text>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
          {label}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  content: { padding: 16 },
  summary: {
    alignItems: "center",
    paddingVertical: 18,
    gap: 8,
  },
  summaryName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  summaryDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderWidth: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
  },
  exCard: {
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  exName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  exSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  setList: {
    gap: 8,
    marginTop: 4,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 10,
  },
  setNum: {
    width: 22,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  setValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
