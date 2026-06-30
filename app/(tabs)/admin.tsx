import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { API_BASE, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface ActivityLog {
  id: number;
  action: string;
  description: string;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "member";
  created_at: string;
}

type AdminView = "users" | "activity";
type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAction(action: string) {
  return action
    .split(".")
    .map((part) => part.replace(/_/g, " "))
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ");
}

function metadataSummary(metadata?: Record<string, unknown> | null) {
  if (!metadata) return "";

  return Object.entries(metadata)
    .map(([key, value]) => {
      const label = key.replace(/_/g, " ");
      if (value === null || value === undefined) return "";
      if (typeof value === "object") return "";
      return `${label}: ${String(value)}`;
    })
    .filter(Boolean)
    .join(" | ");
}

function getActionIcon(action: string): FeatherIconName {
  if (action.startsWith("auth.")) return "log-in";
  if (action.startsWith("profile.")) return "user";
  if (action.includes("template")) return "clipboard";
  if (action.includes("session")) return "activity";
  return "shield";
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [activeView, setActiveView] = useState<AdminView>("users");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const isAdmin = user?.role === "admin";

  const stats = useMemo(() => {
    const adminCount = users.filter((adminUser) => adminUser.role === "admin").length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = logs.filter((log) => {
      const date = new Date(log.created_at);
      return !Number.isNaN(date.getTime()) && date >= today;
    }).length;

    return {
      users: users.length,
      admins: adminCount,
      today: todayCount,
    };
  }, [logs, users]);

  const fetchJson = useCallback(
    async (path: string, init?: RequestInit) => {
      if (!token || !isAdmin) return;

      const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.body ? { "Content-Type": "application/json" } : {}),
          ...init?.headers,
        },
      });

      let data: { error?: string; message?: string } | null = null;
      try {
        data = await response.json();
      } catch (_) {
      }

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Admin request failed.");
      }

      return data;
    },
    [isAdmin, token]
  );

  const loadAdminData = useCallback(async () => {
    if (!token || !isAdmin) return;

    setError("");
    const [usersData, logsData] = await Promise.all([
      fetchJson("/admin/users") as Promise<{ users?: AdminUser[] } | undefined>,
      fetchJson("/admin/activity-logs?limit=75") as Promise<
        { logs?: ActivityLog[] } | undefined
      >,
    ]);

    setUsers(usersData?.users ?? []);
    setLogs(logsData?.logs ?? []);
  }, [fetchJson, isAdmin, token]);

  useEffect(() => {
    let active = true;

    async function run() {
      if (!isAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        await loadAdminData();
      } catch (e: unknown) {
        if (active) {
          setError(e instanceof Error ? e.message : "Admin data could not be loaded.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [isAdmin, loadAdminData]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadAdminData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Admin data could not be loaded.");
    } finally {
      setRefreshing(false);
    }
  }

  async function updateUserRole(targetUser: AdminUser, role: AdminUser["role"]) {
    if (!token || targetUser.role === role) return;

    setUpdatingUserId(targetUser.id);
    setError("");
    try {
      const data = (await fetchJson(`/admin/users/${targetUser.id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      })) as { user?: AdminUser } | undefined;

      if (data?.user) {
        setUsers((current) =>
          current.map((adminUser) =>
            adminUser.id === data.user?.id ? { ...adminUser, ...data.user } : adminUser
          )
        );
      }

      await loadAdminData();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "User role could not be updated.");
    } finally {
      setUpdatingUserId(null);
    }
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
        <View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Admin
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
            User management
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleRefresh}
          disabled={refreshing || !isAdmin}
          hitSlop={8}
          style={[styles.refreshBtn, { backgroundColor: colors.muted }]}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Feather name="refresh-cw" size={18} color={colors.foreground} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.statsRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.users}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Users
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.admins}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Admins
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {stats.today}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
              Today
            </Text>
          </View>
        </View>

        {!isAdmin ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="lock" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Admin access required
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Sign in with an admin account to manage users and view activity logs.
            </Text>
          </View>
        ) : loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
              Loading admin data
            </Text>
          </View>
        ) : error ? (
          <View
            style={[
              styles.errorBox,
              {
                backgroundColor: colors.destructive + "16",
                borderColor: colors.destructive + "40",
              },
            ]}
          >
            <Feather name="alert-circle" size={18} color={colors.destructive} />
            <Text style={[styles.errorText, { color: colors.destructive }]}>
              {error}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.segment, { backgroundColor: colors.muted }]}>
              {(["users", "activity"] as AdminView[]).map((view) => (
                <TouchableOpacity
                  key={view}
                  onPress={() => setActiveView(view)}
                  style={[
                    styles.segmentButton,
                    activeView === view && { backgroundColor: colors.card },
                  ]}
                >
                  <Feather
                    name={view === "users" ? "users" : "activity"}
                    size={16}
                    color={activeView === view ? colors.foreground : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          activeView === view ? colors.foreground : colors.mutedForeground,
                      },
                    ]}
                  >
                    {view === "users" ? "Users" : "Activity"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeView === "users" ? (
              <UserList
                colors={colors}
                currentUserId={user?.id}
                updatingUserId={updatingUserId}
                users={users}
                onUpdateRole={updateUserRole}
              />
            ) : (
              <ActivityLogList colors={colors} logs={logs} />
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function UserList({
  colors,
  currentUserId,
  updatingUserId,
  users,
  onUpdateRole,
}: {
  colors: ReturnType<typeof useColors>;
  currentUserId?: number;
  updatingUserId: number | null;
  users: AdminUser[];
  onUpdateRole: (targetUser: AdminUser, role: AdminUser["role"]) => void;
}) {
  if (users.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="users" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No users yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Registered accounts will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.logList}>
      {users.map((adminUser) => {
        const isSelf = adminUser.id === currentUserId;
        const isUpdating = updatingUserId === adminUser.id;
        const nextRole = adminUser.role === "admin" ? "member" : "admin";
        return (
          <View
            key={adminUser.id}
            style={[
              styles.logItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}
            >
              <Feather
                name={adminUser.role === "admin" ? "shield" : "user"}
                size={17}
                color={colors.primary}
              />
            </View>
            <View style={styles.logBody}>
              <View style={styles.logTop}>
                <Text
                  style={[styles.logAction, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {adminUser.name}
                </Text>
                <View
                  style={[
                    styles.roleBadge,
                    {
                      backgroundColor:
                        adminUser.role === "admin" ? colors.primary + "18" : colors.muted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.roleText,
                      {
                        color:
                          adminUser.role === "admin"
                            ? colors.primary
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {adminUser.role}
                  </Text>
                </View>
              </View>
              <Text
                style={[styles.logMeta, { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {adminUser.email}
                {isSelf ? " | You" : ""}
              </Text>
              <View style={styles.userActions}>
                <TouchableOpacity
                  onPress={() => onUpdateRole(adminUser, nextRole)}
                  disabled={isUpdating || isSelf}
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: isSelf ? colors.muted : colors.primary,
                      opacity: isUpdating || isSelf ? 0.6 : 1,
                    },
                  ]}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color={colors.primaryForeground} />
                  ) : (
                    <>
                      <Feather
                        name={nextRole === "admin" ? "shield" : "user"}
                        size={14}
                        color={isSelf ? colors.mutedForeground : colors.primaryForeground}
                      />
                      <Text
                        style={[
                          styles.roleButtonText,
                          {
                            color: isSelf
                              ? colors.mutedForeground
                              : colors.primaryForeground,
                          },
                        ]}
                      >
                        {nextRole === "admin" ? "Make Admin" : "Make Member"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function ActivityLogList({
  colors,
  logs,
}: {
  colors: ReturnType<typeof useColors>;
  logs: ActivityLog[];
}) {
  if (logs.length === 0) {
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Feather name="shield" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No activity yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          New sign-ins, profile changes, and workout updates will appear here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.logList}>
      {logs.map((log) => {
        const details = metadataSummary(log.metadata);
        return (
          <View
            key={log.id}
            style={[
              styles.logItem,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.iconWrap, { backgroundColor: colors.primary + "18" }]}
            >
              <Feather
                name={getActionIcon(log.action)}
                size={17}
                color={colors.primary}
              />
            </View>
            <View style={styles.logBody}>
              <View style={styles.logTop}>
                <Text
                  style={[styles.logAction, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {formatAction(log.action)}
                </Text>
                <Text style={[styles.logTime, { color: colors.mutedForeground }]}>
                  {formatDate(log.created_at)}
                </Text>
              </View>
              <Text style={[styles.logDescription, { color: colors.foreground }]}>
                {log.description}
              </Text>
              <Text
                style={[styles.logMeta, { color: colors.mutedForeground }]}
                numberOfLines={2}
              >
                {log.user ? `${log.user.name} | ${log.user.email}` : "Unknown user"}
                {log.ip_address ? ` | ${log.ip_address}` : ""}
              </Text>
              {details ? (
                <Text
                  style={[styles.logDetails, { color: colors.mutedForeground }]}
                  numberOfLines={2}
                >
                  {details}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  headerSubtitle: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 20, paddingBottom: 120, gap: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  centerState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  stateText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  errorBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  errorText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  segment: {
    borderRadius: 10,
    padding: 4,
    flexDirection: "row",
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  logList: { gap: 10 },
  logItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  logBody: { flex: 1, gap: 5 },
  logTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  logAction: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
  logTime: { fontSize: 12, fontFamily: "Inter_500Medium" },
  logDescription: { fontSize: 14, fontFamily: "Inter_500Medium" },
  logMeta: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  logDetails: { fontSize: 12, lineHeight: 17, fontFamily: "Inter_400Regular" },
  roleBadge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
    textTransform: "uppercase",
  },
  userActions: {
    marginTop: 5,
    flexDirection: "row",
  },
  roleButton: {
    minHeight: 34,
    borderRadius: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Inter_700Bold",
  },
});
