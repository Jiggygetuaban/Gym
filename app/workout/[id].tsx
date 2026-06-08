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
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { ActiveExercise } from "@/types";

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function WorkoutDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { templates } = useStorage();
  const { startWorkout, activeWorkout } = useWorkout();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const template = useMemo(
    () => templates.find((t) => t.id === id),
    [templates, id]
  );

  if (!template) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={{ color: colors.mutedForeground }}>Workout not found</Text>
      </View>
    );
  }

  function handleStart() {
    const exercises: ActiveExercise[] = template!.exercises.map((ex) => ({
      id: genId(),
      exercise: ex.exercise,
      sets: [{ reps: "10", weight: "0", completed: false }],
    }));
    startWorkout(template!.name, template!.id, exercises);
    router.push("/workout/active");
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
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
          <Ionicons
            name="arrow-back"
            size={24}
            color={colors.foreground}
          />
        </TouchableOpacity>
        <Text
          style={[styles.headerTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {template.name}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={template.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.summary}>
            <View
              style={[
                styles.summaryIcon,
                {
                  backgroundColor: colors.primary + "20",
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Ionicons
                name="barbell-outline"
                size={32}
                color={colors.primary}
              />
            </View>
            <Text style={[styles.summaryName, { color: colors.foreground }]}>
              {template.name}
            </Text>
            <Text
              style={[styles.summaryCount, { color: colors.mutedForeground }]}
            >
              {template.exercises.length}{" "}
              {template.exercises.length === 1 ? "exercise" : "exercises"}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.exRow,
              {
                backgroundColor: colors.card,
                borderRadius: colors.radius,
                borderColor: colors.border,
              },
            ]}
          >
            <View
              style={[
                styles.exNum,
                {
                  backgroundColor: colors.muted,
                  borderRadius: 8,
                },
              ]}
            >
              <Text style={[styles.exNumText, { color: colors.mutedForeground }]}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.exInfo}>
              <Text style={[styles.exName, { color: colors.foreground }]}>
                {item.exercise.name}
              </Text>
              <Text style={[styles.exSub, { color: colors.mutedForeground }]}>
                {item.exercise.category} · {item.exercise.equipment}
              </Text>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* Start button */}
      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) },
        ]}
      >
        {activeWorkout ? (
          <View style={styles.activeWarning}>
            <Ionicons
              name="warning-outline"
              size={16}
              color={colors.mutedForeground}
            />
            <Text
              style={[styles.activeWarningText, { color: colors.mutedForeground }]}
            >
              A workout is already in progress
            </Text>
          </View>
        ) : null}
        <TouchableOpacity
          onPress={handleStart}
          disabled={!!activeWorkout}
          activeOpacity={0.85}
          style={[
            styles.startBtn,
            {
              backgroundColor: activeWorkout
                ? colors.muted
                : colors.primary,
              borderRadius: colors.radius,
            },
          ]}
        >
          <Ionicons
            name="play"
            size={20}
            color={
              activeWorkout ? colors.mutedForeground : colors.primaryForeground
            }
          />
          <Text
            style={[
              styles.startBtnText,
              {
                color: activeWorkout
                  ? colors.mutedForeground
                  : colors.primaryForeground,
              },
            ]}
          >
            Start Workout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
  content: { padding: 16, gap: 0 },
  summary: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  summaryIcon: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  summaryName: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  summaryCount: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  exRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  exNum: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  exNumText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  exInfo: { flex: 1 },
  exName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  exSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 8,
  },
  activeWarning: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  activeWarningText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
