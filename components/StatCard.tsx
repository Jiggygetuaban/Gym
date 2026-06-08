import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface StatCardProps {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}

export function StatCard({ label, value, unit, accent }: StatCardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: accent ? colors.primary : colors.card,
          borderRadius: colors.radius,
          borderColor: accent ? "transparent" : colors.border,
        },
      ]}
    >
      <Text
        style={[
          styles.value,
          { color: accent ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {value}
        {unit ? (
          <Text
            style={[
              styles.unit,
              {
                color: accent
                  ? colors.primaryForeground
                  : colors.mutedForeground,
              },
            ]}
          >
            {" "}
            {unit}
          </Text>
        ) : null}
      </Text>
      <Text
        style={[
          styles.label,
          {
            color: accent ? colors.primaryForeground : colors.mutedForeground,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  unit: {
    fontSize: 13,
    fontWeight: "400",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
