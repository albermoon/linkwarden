import useAuthStore from "@/store/auth";
import { useUser } from "@linkwarden/router/user";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Linking,
} from "react-native";
import { nativeApplicationVersion } from "expo-application";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useEffect, useState } from "react";
import {
  AppWindowMac,
  Check,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Folder,
  HardDrive,
  LogOut,
  Mail,
  Moon,
  RefreshCw,
  Smartphone,
  Sun,
  Trash2,
  UserX,
} from "lucide-react-native";
import { SheetManager } from "react-native-actions-sheet";
import WebViewModal from "@/components/WebViewModal";
import { clearCache } from "@/lib/cache";
import {
  formatBytes,
  recomputeStorage,
  useOfflineSyncStore,
} from "@/lib/offlineSync";
import useDataStore from "@/store/data";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import IconBadge from "@/components/ui/IconBadge";
import { SettingsGroup, SettingsRow } from "@/components/ui/SettingsRow";

export default function SettingsScreen() {
  const { signOut, auth } = useAuthStore();
  const { data: user } = useUser(auth);
  const { colorScheme, setColorScheme } = useColorScheme();
  const { data, updateData } = useDataStore();
  const [override, setOverride] = useState<"light" | "dark" | "system">(
    data.theme || "system"
  );
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  useEffect(() => {
    setColorScheme(override);
    updateData({ theme: override });
  }, [override]);

  const router = useRouter();

  const syncStatus = useOfflineSyncStore((s) => s.status);
  const syncProcessed = useOfflineSyncStore((s) => s.processed);
  const syncTotal = useOfflineSyncStore((s) => s.total);
  const bytesUsed = useOfflineSyncStore((s) => s.bytesUsed);
  const syncPercent =
    syncTotal > 0 ? Math.floor((syncProcessed / syncTotal) * 100) : null;
  const syncStatusLabel =
    syncStatus === "paused"
      ? "Waiting for connection"
      : syncStatus !== "syncing"
        ? "Up to date"
        : syncPercent === null
          ? "Preparing…"
          : `${syncPercent}%`;

  const theme = rawTheme[colorScheme as ThemeName];
  const displayName = user?.name || user?.username || "";
  const identity = user?.email || (user?.username ? "@" + user.username : "");
  const initial = (displayName || identity || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  const CheckMark = ({ active }: { active: boolean }) =>
    active ? <Check size={20} color={theme.primary} /> : null;

  return (
    <View
      style={styles.container}
      collapsable={false}
      collapsableChildren={false}
      className="bg-base-100"
    >
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 32,
        }}
        contentContainerClassName="flex-col gap-7"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="overflow-hidden rounded-2xl bg-base-200">
          <View className="flex-row items-center gap-3.5 px-4 pb-4 pt-4">
            <IconBadge color={theme.primary} size={52} radius={26} tint={0.18}>
              <Text className="text-xl font-bold text-primary">{initial}</Text>
            </IconBadge>
            <View className="flex-1">
              {displayName ? (
                <Text
                  className="text-lg font-semibold text-base-content"
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
              ) : null}
              <Text className="text-sm text-neutral" numberOfLines={1}>
                {identity}
              </Text>
            </View>
          </View>
          <View className="h-px bg-neutral-content opacity-60" />
          <TouchableOpacity
            className="flex-row items-center px-4 py-3.5"
            activeOpacity={0.6}
            onPress={() => setShowAccountSettings(true)}
          >
            <Text className="flex-1 text-base text-base-content">
              More Account Settings
            </Text>
            <ChevronRight size={18} color={theme.neutral} />
          </TouchableOpacity>
          <View className="h-px bg-neutral-content opacity-60" />
          <TouchableOpacity
            className="flex-row items-center px-4 py-3.5"
            activeOpacity={0.6}
            onPress={() =>
              Alert.alert("Sign Out", "Are you sure you want to sign out?", [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Sign Out",
                  style: "destructive",
                  onPress: () => {
                    signOut();
                  },
                },
              ])
            }
          >
            <Text className="flex-1 text-base text-red-500">Sign Out</Text>
            <LogOut size={18} color={theme.error} />
          </TouchableOpacity>
        </View>

        <SettingsGroup title="Theme">
          <SettingsRow
            icon={<Smartphone size={18} color={theme.neutral} />}
            color={theme.neutral}
            label="System Defaults"
            right={<CheckMark active={override === "system"} />}
            onPress={() => setOverride("system")}
          />
          <SettingsRow
            icon={<Sun size={18} color="#F59E0B" />}
            color="#F59E0B"
            label="Light"
            right={<CheckMark active={override === "light"} />}
            onPress={() => setOverride("light")}
          />
          <SettingsRow
            icon={<Moon size={18} color="#6366F1" />}
            color="#6366F1"
            label="Dark"
            right={<CheckMark active={override === "dark"} />}
            onPress={() => setOverride("dark")}
          />
        </SettingsGroup>

        <SettingsGroup title="Preferred Browser">
          <SettingsRow
            icon={<AppWindowMac size={18} color={theme.primary} />}
            color={theme.primary}
            label="In app browser"
            right={<CheckMark active={data.preferredBrowser === "app"} />}
            onPress={() =>
              updateData({
                preferredBrowser: "app",
              })
            }
          />
          <SettingsRow
            icon={<ExternalLink size={18} color={theme.primary} />}
            color={theme.primary}
            label="System default browser"
            right={<CheckMark active={data.preferredBrowser === "system"} />}
            onPress={() =>
              updateData({
                preferredBrowser: "system",
              })
            }
          />
        </SettingsGroup>

        <SettingsGroup title="Save Shared Links To">
          <SettingsRow
            icon={<Folder size={18} color={theme.primary} />}
            color={theme.primary}
            label="Preferred collection"
            right={
              <View className="flex-row items-center gap-1.5">
                <Text numberOfLines={1} className="max-w-[140px] text-neutral">
                  {data.preferredCollection?.name || "None"}
                </Text>
                <ChevronRight size={18} color={theme.neutral} />
              </View>
            }
            onPress={() => router.navigate("/settings/preferredCollection")}
          />
        </SettingsGroup>

        <SettingsGroup title="Offline Storage">
          <SettingsRow
            icon={<Download size={18} color="#10B981" />}
            color="#10B981"
            label="Save for offline access"
            description="Automatically saves preserved formats for links loaded in the app to this device for offline access. When this is off, only formats you open are saved."
            right={
              <Switch
                value={!!data.offlineEnabled}
                onValueChange={(value) => updateData({ offlineEnabled: value })}
                trackColor={{
                  true: theme.primary,
                }}
                thumbColor={theme["base-100"]}
              />
            }
          />
          {data.offlineEnabled ? (
            <SettingsRow
              icon={<RefreshCw size={18} color="#0EA5E9" />}
              color="#0EA5E9"
              label="Offline sync"
              right={
                <View className="flex-row items-center gap-2">
                  {syncStatus === "syncing" ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : null}
                  <Text className="text-neutral">{syncStatusLabel}</Text>
                </View>
              }
            />
          ) : null}
          <SettingsRow
            icon={<HardDrive size={18} color={theme.neutral} />}
            color={theme.neutral}
            label="Storage used"
            right={
              <Text className="text-neutral">{formatBytes(bytesUsed)}</Text>
            }
          />
          <SettingsRow
            icon={
              <Trash2
                size={18}
                color={syncStatus === "syncing" ? theme.neutral : theme.error}
              />
            }
            color={theme.error}
            label="Clear cache"
            labelClassName="text-red-500"
            disabled={syncStatus === "syncing"}
            onPress={() =>
              Alert.alert(
                "Clear cache",
                "This will delete all downloaded formats and previews from this device.",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                      await clearCache();
                      useOfflineSyncStore.getState().reset();
                      await recomputeStorage();
                    },
                  },
                ]
              )
            }
          />
        </SettingsGroup>

        <SettingsGroup title="Contact Us">
          <SettingsRow
            icon={<Mail size={18} color={theme.primary} />}
            color={theme.primary}
            label="support@linkwarden.app"
            right={<Copy size={16} color={theme.neutral} />}
            onPress={async () => {
              await Clipboard.setStringAsync("support@linkwarden.app");
              Alert.alert("Copied to clipboard", "support@linkwarden.app");
            }}
          />
        </SettingsGroup>

        <SettingsGroup title="Account Deletion">
          <SettingsRow
            icon={<UserX size={18} color={theme.error} />}
            color={theme.error}
            label="Delete Account"
            labelClassName="text-red-500"
            right={<ChevronRight size={18} color={theme.neutral} />}
            onPress={() => SheetManager.show("delete-account-sheet")}
          />
        </SettingsGroup>

        <Text className="mx-auto text-xs text-neutral">
          Linkwarden for {Platform.OS === "ios" ? "iOS" : "Android"}{" "}
          {nativeApplicationVersion}
        </Text>
      </ScrollView>

      <WebViewModal
        visible={showAccountSettings}
        onClose={() => setShowAccountSettings(false)}
        title="Linkwarden Web"
        uri={`${auth.instance}/settings/account`}
        sessionToken={auth.session}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
