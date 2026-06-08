import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
import { CATEGORIES, EXERCISES } from "@/constants/exercises";
import { useStorage } from "@/context/StorageContext";
import { useWorkout } from "@/context/WorkoutContext";
import { useColors } from "@/hooks/useColors";
import { ActiveExercise, Exercise, WorkoutSession } from "@/types";

function formatTimer(s: number) {
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0)
    return `${h}:${String(m % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function computeVolume(exercises: ActiveExercise[]) {
  return exercises.reduce((total, ex) => {
    return (
      total +
      ex.sets.reduce((t, s) => {
        if (!s.completed) return t;
        const w = parseFloat(s.weight) || 0;
        const r = parseInt(s.reps) || 0;
        return t + w * r;
      }, 0)
    );
  }, 0);
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ─── Set Row ────────────────────────────────────────────────────────────────
function SetRow({
  setIndex,
  reps,
  weight,
  completed,
  onToggle,
  onChangeReps,
  onChangeWeight,
  onRemove,
}: {
  setIndex: number;
  reps: string;
  weight: string;
  completed: boolean;
  onToggle: () => void;
  onChangeReps: (v: string) => void;
  onChangeWeight: (v: string) => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.setRow,
        completed && { backgroundColor: colors.success + "14" },
      ]}
    >
      <Text style={[styles.setNum, { color: colors.mutedForeground }]}>
        {setIndex + 1}
      </Text>
      <TextInput
        value={weight}
        onChangeText={onChangeWeight}
        keyboardType="decimal-pad"
        style={[
          styles.setInput,
          {
            backgroundColor: colors.input,
            color: colors.foreground,
            borderRadius: 8,
          },
        ]}
        placeholder="kg"
        placeholderTextColor={colors.mutedForeground}
        selectTextOnFocus
      />
      <Text style={[styles.setX, { color: colors.mutedForeground }]}>×</Text>
      <TextInput
        value={reps}
        onChangeText={onChangeReps}
        keyboardType="number-pad"
        style={[
          styles.setInput,
          {
            backgroundColor: colors.input,
            color: colors.foreground,
            borderRadius: 8,
          },
        ]}
        placeholder="reps"
        placeholderTextColor={colors.mutedForeground}
        selectTextOnFocus
      />
      <TouchableOpacity
        onPress={onToggle}
        style={[
          styles.checkBtn,
          {
            backgroundColor: completed
              ? colors.success
              : colors.muted,
            borderRadius: 8,
          },
        ]}
      >
        <Ionicons
          name="checkmark"
          size={18}
          color={
            completed ? colors.successForeground : colors.mutedForeground
          }
        />
      </TouchableOpacity>
      <TouchableOpacity onPress={onRemove} hitSlop={8}>
        <Ionicons name="close" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Exercise Card ──────────────────────────────────────────────────────────
function ExerciseCard({ item }: { item: ActiveExercise }) {
  const colors = useColors();
  const {
    addSet,
    removeSet,
    updateSet,
    toggleSetComplete,
    removeExercise,
  } = useWorkout();

  return (
    <View
      style={[
        styles.exCard,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.exHeader}>
        <View>
          <Text style={[styles.exName, { color: colors.foreground }]}>
            {item.exercise.name}
          </Text>
          <Text style={[styles.exCategory, { color: colors.mutedForeground }]}>
            {item.exercise.category} · {item.exercise.equipment}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() =>
            Alert.alert("Remove Exercise", `Remove ${item.exercise.name}?`, [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: () => removeExercise(item.id),
              },
            ])
          }
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Set headers */}
      <View style={styles.setHeader}>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, width: 24 }]}>#</Text>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Weight</Text>
        <Text style={[styles.setHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Reps</Text>
        <View style={{ width: 80 }} />
      </View>

      {item.sets.map((set, i) => (
        <SetRow
          key={i}
          setIndex={i}
          reps={set.reps}
          weight={set.weight}
          completed={set.completed}
          onToggle={() => toggleSetComplete(item.id, i)}
          onChangeReps={(v) => updateSet(item.id, i, "reps", v)}
          onChangeWeight={(v) => updateSet(item.id, i, "weight", v)}
          onRemove={() =>
            item.sets.length > 1 ? removeSet(item.id, i) : null
          }
        />
      ))}

      <TouchableOpacity
        onPress={() => addSet(item.id)}
        style={[
          styles.addSetBtn,
          {
            borderColor: colors.border,
            borderRadius: colors.radius - 4,
          },
        ]}
      >
        <Ionicons name="add" size={16} color={colors.primary} />
        <Text style={[styles.addSetText, { color: colors.primary }]}>
          Add Set
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Exercise Picker Modal ──────────────────────────────────────────────────
function ExercisePicker({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (ex: Exercise) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchCat =
        activeCategory === "All" || ex.category === activeCategory;
      const matchSearch =
        !search ||
        ex.name.toLowerCase().includes(search.toLowerCase()) ||
        ex.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.pickerRoot,
          { backgroundColor: colors.background },
        ]}
      >
        <View
          style={[
            styles.pickerHeader,
            { borderBottomColor: colors.border },
          ]}
        >
          <Text style={[styles.pickerTitle, { color: colors.foreground }]}>
            Add Exercise
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={24} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
          <View
            style={[
              styles.searchBar,
              { backgroundColor: colors.muted, borderRadius: colors.radius },
            ]}
          >
            <Ionicons name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search exercises..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
            />
          </View>
        </View>

        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={{ flexGrow: 0 }}
        >
          {["All", ...CATEGORIES].map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    activeCategory === cat ? colors.primary : colors.muted,
                  borderRadius: 20,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      activeCategory === cat
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                  },
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filtered}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                onSelect(item);
                onClose();
                setSearch("");
              }}
              style={[
                styles.pickerItem,
                { borderBottomColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <View>
                <Text
                  style={[styles.pickerItemName, { color: colors.foreground }]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.pickerItemSub,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.category} · {item.equipment}
                </Text>
              </View>
              <Ionicons
                name="add-circle-outline"
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        />
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function ActiveWorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { activeWorkout, elapsedSeconds, cancelWorkout, finishWorkout, addExercise } =
    useWorkout();
  const { saveSession } = useStorage();
  const [pickerVisible, setPickerVisible] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!activeWorkout) {
    return (
      <View
        style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}
      >
        <Text style={{ color: colors.mutedForeground }}>No active workout</Text>
      </View>
    );
  }

  function handleCancel() {
    Alert.alert(
      "Cancel Workout",
      "Discard this workout session?",
      [
        { text: "Keep Going", style: "cancel" },
        {
          text: "Discard",
          style: "destructive",
          onPress: () => {
            cancelWorkout();
            router.back();
          },
        },
      ]
    );
  }

  function handleFinish() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const workout = finishWorkout();
    const totalVolume = computeVolume(workout.exercises);
    const session: WorkoutSession = {
      id: genId(),
      name: workout.name,
      templateId: workout.templateId,
      startedAt: workout.startedAt,
      finishedAt: Date.now(),
      duration: elapsedSeconds,
      exercises: workout.exercises,
      totalVolume,
    };
    saveSession(session);
    router.replace("/(tabs)");
  }

  const completedSets = activeWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.activeHeader,
          {
            paddingTop: topInset + 12,
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity onPress={handleCancel} hitSlop={8}>
          <Ionicons
            name="close"
            size={24}
            color={colors.mutedForeground}
          />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text
            style={[styles.activeWorkoutName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {activeWorkout.name}
          </Text>
          <Text style={[styles.timer, { color: colors.primary }]}>
            {formatTimer(elapsedSeconds)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleFinish}
          style={[
            styles.finishBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Text
            style={[styles.finishBtnText, { color: colors.primaryForeground }]}
          >
            Finish
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats bar */}
      <View
        style={[
          styles.statsBar,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {activeWorkout.exercises.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Exercises
          </Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {completedSets}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Sets Done
          </Text>
        </View>
        <View
          style={[styles.statDivider, { backgroundColor: colors.border }]}
        />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.foreground }]}>
            {computeVolume(activeWorkout.exercises).toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
            Vol (kg)
          </Text>
        </View>
      </View>

      <FlatList
        data={activeWorkout.exercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.exerciseList,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyEx}>
            <Ionicons
              name="barbell-outline"
              size={40}
              color={colors.mutedForeground}
            />
            <Text style={[styles.emptyExText, { color: colors.mutedForeground }]}>
              Tap the button below to add exercises
            </Text>
          </View>
        }
        renderItem={({ item }) => <ExerciseCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />

      {/* Add Exercise FAB */}
      <View
        style={[
          styles.fabWrap,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 50 : 20) },
        ]}
      >
        <TouchableOpacity
          onPress={() => setPickerVisible(true)}
          activeOpacity={0.85}
          style={[
            styles.fab,
            { backgroundColor: colors.foreground, borderRadius: 30 },
          ]}
        >
          <Ionicons
            name="add"
            size={22}
            color={colors.background}
          />
          <Text style={[styles.fabText, { color: colors.background }]}>
            Add Exercise
          </Text>
        </TouchableOpacity>
      </View>

      <ExercisePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={addExercise}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  activeWorkoutName: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  timer: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  finishBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  statsBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    gap: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statDivider: { width: 1, marginVertical: 10 },
  exerciseList: { padding: 16 },
  exCard: {
    padding: 16,
    borderWidth: 1,
    gap: 10,
  },
  exHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  exName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  exCategory: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  setHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  setHeaderText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  setNum: {
    width: 20,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  setInput: {
    flex: 1,
    height: 38,
    paddingHorizontal: 10,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  setX: {
    fontSize: 16,
    fontWeight: "600",
  },
  checkBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  addSetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: 4,
  },
  addSetText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  emptyEx: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyExText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  fabWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  fab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 28,
    paddingVertical: 14,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  // Picker
  pickerRoot: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  searchWrap: { padding: 16, paddingBottom: 8 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  chips: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pickerItemName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  pickerItemSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
