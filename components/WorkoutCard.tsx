import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { WorkoutSession, WorkoutTemplate } from "@/types";
import { useColors } from "@/hooks/useColors";

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
  const d = new Date(ts);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 7)
    return d.toLocaleDateString("en-US", { weekday: "long" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface SessionCardProps {
  session: WorkoutSession;
  onPress?: () => void;
  onDelete?: () => void;
}

export function SessionCard({ session, onPress, onDelete }: SessionCardProps) {
  const colors = useColors();
  const completedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {session.name}
          </Text>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
            {formatDate(session.startedAt)}
          </Text>
        </View>
        {onDelete && (
          <TouchableOpacity onPress={onDelete} hitSlop={8}>
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.metaRow}>
        <MetaBadge
          icon="time-outline"
          label={formatDuration(session.duration)}
          colors={colors}
        />
        <MetaBadge
          icon="barbell-outline"
          label={`${session.exercises.length} exercises`}
          colors={colors}
        />
        <MetaBadge
          icon="trending-up-outline"
          label={formatVolume(session.totalVolume)}
          colors={colors}
        />
        <MetaBadge
          icon="checkmark-circle-outline"
          label={`${completedSets} sets`}
          colors={colors}
        />
      </View>
    </TouchableOpacity>
  );
}

interface TemplateCardProps {
  template: WorkoutTemplate;
  onPress?: () => void;
  onDelete?: () => void;
}

export function TemplateCard({
  template,
  onPress,
  onDelete,
}: TemplateCardProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconWrap, { backgroundColor: colors.primary + "20", borderRadius: colors.radius - 4 }]}>
          <Ionicons name="barbell-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.cardInfo}>
          <Text
            style={[styles.cardTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {template.name}
          </Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {template.exercises.length}{" "}
            {template.exercises.length === 1 ? "exercise" : "exercises"}
          </Text>
        </View>
        {onDelete ? (
          <TouchableOpacity onPress={onDelete} hitSlop={8}>
            <Ionicons
              name="trash-outline"
              size={18}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        ) : (
          <Ionicons
            name="chevron-forward"
            size={20}
            color={colors.mutedForeground}
          />
        )}
      </View>
      {template.exercises.length > 0 && (
        <Text
          style={[styles.exerciseList, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {template.exercises.map((e) => e.exercise.name).join(" · ")}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function MetaBadge({
  icon,
  label,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={13} color={colors.mutedForeground} />
      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardTitleRow: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  cardSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  cardDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  exerciseList: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
