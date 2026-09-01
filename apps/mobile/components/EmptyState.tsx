import React from "react";
import {
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SearchX } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { rawTheme, ThemeName } from "@/lib/colors";
import IconBadge from "@/components/ui/IconBadge";

type Props = {
  /** Whether to render the message. Hidden e.g. while still fetching. */
  showMessage?: boolean;
  message?: string;
  /** Optional secondary line under the message. */
  hint?: string;
  /** Icon rendered inside the tinted badge. Defaults to a search icon. */
  icon?: React.ReactNode;
  refreshControl?: ScrollViewProps["refreshControl"];
};

/**
 * Empty-state for the list screens. A full-window ScrollView keeps pull-to-refresh
 * working, with the message centered via an absolute overlay.
 *
 * The overlay is used (instead of flexGrow/centerContent) because on iOS the
 * transparent large-title header makes the scroll container full-window and the
 * header inset is invisible to JS, so layout-based centering fails/races on cold
 * start. On Android the header is opaque, so the overlay instead fills down behind
 * the bottom system inset and the message lands slightly low — pad it back up.
 */
export default function EmptyState({
  showMessage = true,
  message = "Nothing found",
  hint,
  icon,
  refreshControl,
}: Props) {
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ flexGrow: 1 }}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      />
      {showMessage && (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            {
              justifyContent: "center",
              alignItems: "center",
              paddingBottom: Platform.OS === "android" ? insets.bottom : 0,
            },
          ]}
        >
          <View className="items-center gap-3 px-10">
            <IconBadge color={theme.primary} size={64} radius={32} tint={0.12}>
              {icon ?? <SearchX size={28} color={theme.primary} />}
            </IconBadge>
            <Text className="text-center text-lg font-semibold text-base-content">
              {message}
            </Text>
            {hint ? (
              <Text className="text-center text-sm leading-5 text-neutral">
                {hint}
              </Text>
            ) : null}
          </View>
        </View>
      )}
    </View>
  );
}
