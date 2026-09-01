import { View, Text, Pressable, Platform, Alert } from "react-native";
import { decode } from "html-entities";
import { CollectionIncludingMembersAndLinkCount } from "@linkwarden/types/global";
import useAuthStore from "@/store/auth";
import { useRouter } from "expo-router";
import * as ContextMenu from "zeego/context-menu";
import { cn } from "@linkwarden/lib/utils";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { CalendarDays, ChevronRight, Folder, Link } from "lucide-react-native";
import IconBadge from "@/components/ui/IconBadge";
import { useDeleteCollection } from "@linkwarden/router/collections";

type Props = {
  collection: CollectionIncludingMembersAndLinkCount;
};

const CollectionListing = ({ collection }: Props) => {
  const { auth } = useAuthStore();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const deleteCollection = useDeleteCollection({ auth, Alert });
  const theme = rawTheme[colorScheme as ThemeName];
  const color = collection.color || "#0ea5e9";

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <Pressable
          className={cn(
            "flex-row items-center gap-3.5 overflow-hidden rounded-2xl bg-base-200 p-4",
            Platform.OS !== "android" && "active:opacity-80"
          )}
          onLongPress={() => {}}
          onPress={() => router.navigate(`/collections/${collection.id}`)}
          android_ripple={{
            color: colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "#ddd",
            borderless: false,
          }}
        >
          <IconBadge color={color} size={46} radius={14}>
            <Folder size={22} fill={color} color={color} />
          </IconBadge>

          <View className="flex-1">
            <Text
              numberOfLines={1}
              className="text-base font-semibold text-base-content"
            >
              {decode(collection.name)}
            </Text>
            {collection.description ? (
              <Text
                numberOfLines={2}
                className="mt-0.5 text-sm leading-5 text-neutral"
              >
                {decode(collection.description)}
              </Text>
            ) : null}

            <View className="mt-2 flex-row items-center gap-1.5">
              <Link size={13} color={theme.neutral} />
              <Text numberOfLines={1} className="text-xs text-neutral">
                {collection._count?.links ?? 0}{" "}
                {collection._count?.links === 1 ? "link" : "links"}
              </Text>
              <View className="mx-0.5 h-1 w-1 rounded-full bg-neutral" />
              <CalendarDays size={13} color={theme.neutral} />
              <Text numberOfLines={1} className="text-xs text-neutral">
                {new Date(collection.createdAt as string).toLocaleString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )}
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color={theme.neutral} />
        </Pressable>
      </ContextMenu.Trigger>

      <ContextMenu.Content avoidCollisions>
        <ContextMenu.Item
          key="delete-collection"
          onSelect={() => {
            return Alert.alert(
              "Delete Collection",
              "Are you sure you want to delete this collection? This action cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    deleteCollection.mutate(collection.id as number);
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

export default CollectionListing;
