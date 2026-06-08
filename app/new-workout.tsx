import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
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
import { useColors } from "@/hooks/useColors";
import { ActiveExercise, Exercise, WorkoutTemplate } from "@/types";

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export default function NewWorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { saveTemplate } = useStorage();

  const [name, setName] = useState("");
  const [selected, setSelected] = useState<ActiveExercise[]>([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [tab, setTab] = useState<"details" | "exercises">("details");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    return EXERCISES.filter((ex) => {
      const matchCat =
        activeCategory === "All" || ex.category === activeCategory;
      const matchSearch =
        !search || ex.name.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [search, activeCategory]);

  function toggleExercise(ex: Exercise) {
    setSelected((prev) => {
      const exists = prev.find((e) => e.exercise.id === ex.id);
      if (exists) return prev.filter((e) => e.exercise.id !== ex.id);
      return [
        ...prev,
        { id: genId(), exercise: ex, sets: [{ reps: "10", weight: "0", completed: false }] },
      ];
    });
  }

  function isSelected(exId: string) {
    return selected.some((e) => e.exercise.id === exId);
  }

  function handleSave() {
    if (!name.trim()) return;
    const template: WorkoutTemplate = {
      id: genId(),
      name: name.trim(),
      exercises: selected,
      createdAt: Date.now(),
    };
    saveTemplate(template);
    router.back();
  }

  const canSave = name.trim().length > 0;

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
          <Ionicons name="close" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          New Workout
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={8}
        >
          <Text
            style={[
              styles.saveBtn,
              { color: canSave ? colors.primary : colors.mutedForeground },
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab switcher */}
      <View
        style={[
          styles.tabs,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {(["details", "exercises"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            onPress={() => setTab(t)}
            style={[
              styles.tabItem,
              tab === t && {
                borderBottomWidth: 2,
                borderBottomColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    tab === t ? colors.primary : colors.mutedForeground,
                },
              ]}
            >
              {t === "details" ? "Details" : `Exercises (${selected.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === "details" ? (
        <ScrollView
          contentContainerStyle={[
            styles.detailContent,
            { paddingBottom: bottomInset + 40 },
          ]}
        >
          <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>
            WORKOUT NAME
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Push Day, Leg Day..."
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.nameInput,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
                borderRadius: colors.radius,
              },
            ]}
            autoFocus
            returnKeyType="next"
          />

          {selected.length > 0 && (
            <>
              <Text
                style={[styles.inputLabel, { color: colors.mutedForeground }]}
              >
                SELECTED EXERCISES
              </Text>
              {selected.map((ex, idx) => (
                <View
                  key={ex.id}
                  style={[
                    styles.selectedEx,
                    {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                      borderRadius: colors.radius,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.selectedExNum,
                      { backgroundColor: colors.primary + "20", borderRadius: 8 },
                    ]}
                  >
                    <Text
                      style={[styles.selectedExNumText, { color: colors.primary }]}
                    >
                      {idx + 1}
                    </Text>
                  </View>
                  <Text
                    style={[styles.selectedExName, { color: colors.foreground }]}
                  >
                    {ex.exercise.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => toggleExercise(ex.exercise)}
                    hitSlop={8}
                  >
                    <Ionicons name="close" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <TouchableOpacity
            onPress={() => setTab("exercises")}
            style={[
              styles.addExBtn,
              {
                borderColor: colors.border,
                borderRadius: colors.radius,
              },
            ]}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.addExBtnText, { color: colors.primary }]}>
              Add Exercises
            </Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Search */}
          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.background },
            ]}
          >
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
                placeholder="Search..."
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
            keyExtractor={(ex) => ex.id}
            contentContainerStyle={{ paddingBottom: bottomInset + 20 }}
            renderItem={({ item }) => {
              const sel = isSelected(item.id);
              return (
                <TouchableOpacity
                  onPress={() => toggleExercise(item)}
                  style={[
                    styles.exPickerRow,
                    { borderBottomColor: colors.border },
                    sel && { backgroundColor: colors.primary + "0D" },
                  ]}
                  activeOpacity={0.7}
                >
                  <View style={styles.exPickerInfo}>
                    <Text
                      style={[styles.exPickerName, { color: colors.foreground }]}
                    >
                      {item.name}
                    </Text>
                    <Text
                      style={[
                        styles.exPickerSub,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      {item.category} · {item.equipment}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.checkbox,
                      {
                        backgroundColor: sel ? colors.primary : "transparent",
                        borderColor: sel ? colors.primary : colors.border,
                        borderRadius: 6,
                      },
                    ]}
                  >
                    {sel && (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.primaryForeground}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}
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
  saveBtn: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
  },
  tabText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  detailContent: {
    padding: 20,
    gap: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 8,
  },
  nameInput: {
    padding: 14,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    borderWidth: 1,
  },
  selectedEx: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 10,
    borderWidth: 1,
  },
  selectedExNum: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedExNumText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  selectedExName: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  addExBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 8,
    marginTop: 4,
  },
  addExBtnText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  searchWrap: { padding: 12, paddingBottom: 8 },
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
  chips: { paddingHorizontal: 12, paddingBottom: 10, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  exPickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  exPickerInfo: { flex: 1 },
  exPickerName: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  exPickerSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
