import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TemplateCard } from "@/components";
import { useStorage } from "@/context/StorageContext";
import { useColors } from "@/hooks/useColors";

export default function WorkoutsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { templates, deleteTemplate } = useStorage();
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  function handleDelete(id: string, name: string) {
    Alert.alert(
      "Delete Workout",
      `Remove "${name}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTemplate(id),
        },
      ]
    );
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
          Workouts
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/new-workout")}
          hitSlop={8}
          style={[
            styles.addBtn,
            { backgroundColor: colors.primary, borderRadius: colors.radius },
          ]}
        >
          <Ionicons name="add" size={20} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={templates}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: 120 + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyIcon,
                {
                  backgroundColor: colors.muted,
                  borderRadius: colors.radius,
                },
              ]}
            >
              <Ionicons
                name="barbell-outline"
                size={36}
                color={colors.mutedForeground}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No workout templates
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.mutedForeground }]}
            >
              Tap the + button to create your first workout plan
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TemplateCard
            template={item}
            onPress={() => router.push(`/workout/${item.id}`)}
            onDelete={() => handleDelete(item.id, item.name)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: { padding: 20, gap: 0 },
  separator: { height: 10 },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
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
