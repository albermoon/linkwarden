import { View, Text, Pressable, Platform, Alert } from "react-native";
import { decode } from "html-entities";
import { TagIncludingLinkCount } from "@linkwarden/types/global";
import useAuthStore from "@/store/auth";
import { useRouter } from "expo-router";
import * as ContextMenu from "zeego/context-menu";
import { cn } from "@linkwarden/lib/utils";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { CalendarDays, ChevronRight, Hash, Link } from "lucide-react-native";
import IconBadge from "@/components/ui/IconBadge";
import { useRemoveTag } from "@linkwarden/router/tags";

type Props = {
  tag: TagIncludingLinkCount;
};

const TagListing = ({ tag }: Props) => {
  const { auth } = useAuthStore();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const deleteCollection = useRemoveTag(auth);
  const theme = rawTheme[colorScheme as ThemeName];

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <Pressable
          className={cn(
            "flex-row items-center gap-3.5 overflow-hidden rounded-2xl bg-base-200 p-4",
            Platform.OS !== "android" && "active:opacity-80"
          )}
          onLongPress={() => {}}
          onPress={() => router.navigate(`/tags/${tag.id}`)}
          android_ripple={{
            color: colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "#ddd",
            borderless: false,
          }}
        >
          <IconBadge color={theme.primary} size={46} radius={14}>
            <Hash size={22} color={theme.primary} />
          </IconBadge>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-base font-semibold text-base-content"
            >
              {decode(tag.name)}
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <CalendarDays size={13} color={theme.neutral} />
              <Text numberOfLines={1} className="text-xs text-neutral">
                {new Date(tag.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1 rounded-full bg-base-100 px-2.5 py-1">
            <Link size={12} color={theme.neutral} />
            <Text className="text-xs font-medium text-base-content">
              {tag._count?.links ?? 0}
            </Text>
          </View>
          <ChevronRight size={18} color={theme.neutral} />
        </Pressable>
      </ContextMenu.Trigger>

      <ContextMenu.Content avoidCollisions>
        <ContextMenu.Item
          key="delete-tag"
          onSelect={() => {
            return Alert.alert(
              "Delete Tag",
              "Are you sure you want to delete this Tag? This action cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteCollection.mutate(tag.id as number);
                  },
                },
              ]
            );
          }}
        >
          <ContextMenu.ItemTitle>Delete</ContextMenu.ItemTitle>
        </ContextMenu.Item>
      </ContextMenu.Content>
    </ContextMenu.Root>
  );
};

export default TagListing;
