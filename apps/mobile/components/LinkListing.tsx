import {
  View,
  Text,
  Image,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "html-entities";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import { ArchivedFormat } from "@linkwarden/types/global";
import getFormatBasedOnPreference from "@linkwarden/lib/getFormatBasedOnPreference";
import getOriginalFormat from "@linkwarden/lib/getOriginalFormat";
import {
  atLeastOneFormatAvailable,
  formatAvailable,
} from "@linkwarden/lib/formatStats";
import useAuthStore from "@/store/auth";
import { customHeadersFor } from "@/lib/customHeaders";
import { useRouter } from "expo-router";
import * as ContextMenu from "zeego/context-menu";
import { useDeleteLink, useUpdateLink } from "@linkwarden/router/links";
import { SheetManager } from "react-native-actions-sheet";
import * as Clipboard from "expo-clipboard";
import { cn } from "@linkwarden/lib/utils";
import { useUser } from "@linkwarden/router/user";
import { rawTheme, ThemeName, withAlpha } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { CalendarDays, Folder, Globe, Pin } from "lucide-react-native";
import useDataStore from "@/store/data";
import { useEffect, useState } from "react";
import { deleteLinkCache, loadCacheOrFetch } from "@/lib/cache";

type Props = {
  link: LinkIncludingShortenedCollectionAndTags;
  dashboard?: boolean;
};

const LinkListing = ({ link, dashboard }: Props) => {
  const { auth } = useAuthStore();
  const router = useRouter();
  const updateLink = useUpdateLink({ auth, Alert });
  const { data: user } = useUser(auth);
  const { colorScheme } = useColorScheme();
  const { data } = useDataStore();

  const deleteLink = useDeleteLink({ auth, Alert });

  const [url, setUrl] = useState("");
  const [origin, setOrigin] = useState("");
  const [preview, setPreview] = useState("");
  const [faviconFailed, setFaviconFailed] = useState(false);

  const theme = rawTheme[colorScheme as ThemeName];
  const isPinned = !!(link.pinnedBy && link.pinnedBy[0]);
  const collectionColor = link.collection?.color || "#0ea5e9";

  useEffect(() => {
    try {
      if (link.url) {
        const parsed = new URL(link.url);
        setUrl(parsed.host.toLowerCase());
        setOrigin(parsed.origin);
      } else {
        setUrl("");
        setOrigin("");
      }
    } catch (error) {
      setUrl("");
      setOrigin("");
    }
    setFaviconFailed(false);
  }, [link.url]);

  const faviconUri = origin
    ? `${auth.instance}/api/v1/getFavicon?url=${encodeURIComponent(origin)}`
    : "";
  const showFavicon = !!faviconUri && !faviconFailed;

  useEffect(() => {
    loadCacheOrFetch({
      filePath:
        FileSystem.documentDirectory +
        `archivedData/previews/link_${link.id}.jpg`,
      setContent: setPreview,
      shouldFetch: formatAvailable(link, "preview"),
      updatedAt: link.updatedAt,
      onStart: () => setPreview(""),
      errorMessage: "Failed to fetch preview",
      fetchContent: async (filePath) => {
        const apiUrl = `${auth.instance}/api/v1/archives/${link.id}?format=${ArchivedFormat.jpeg}&preview=true&updatedAt=${link.updatedAt}`;

        const result = await FileSystem.downloadAsync(apiUrl, filePath, {
          headers: {
            ...customHeadersFor(apiUrl),
            Authorization: `Bearer ${auth.session}`,
          },
        });

        return result.uri;
      },
    });
  }, [auth.instance, auth.session, link.id, link.preview, link.updatedAt]);

  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        <Pressable
          className={cn(
            "overflow-hidden rounded-2xl bg-base-200",
            dashboard ? "w-64" : "w-full flex-row gap-3.5 p-4",
            Platform.OS !== "android" && "active:opacity-80"
          )}
          onLongPress={() => {}}
          onPress={() => {
            if (user) {
              if (user.linksRouteTo === "DETAILS") {
                SheetManager.show("link-details-sheet", {
                  payload: { link },
                });

                return;
              }

              const format = getFormatBasedOnPreference({
                link,
                preference: user.linksRouteTo,
              });

              data.preferredBrowser === "app"
                ? router.navigate(
                    format !== null
                      ? `/links/${link.id}?format=${format}`
                      : `/links/${link.id}`
                  )
                : Linking.openURL(
                    format !== null
                      ? auth.instance +
                          `/preserved/${link?.id}?format=${format}`
                      : (link.url as string)
                  );
            }
          }}
          android_ripple={{
            color: colorScheme === "dark" ? "rgba(255,255,255,0.2)" : "#ddd",
            borderless: false,
          }}
        >
          {dashboard ? (
            <Thumbnail
              link={link}
              preview={preview}
              faviconUri={showFavicon ? faviconUri : ""}
              onFaviconError={() => setFaviconFailed(true)}
              tintColor={theme.primary}
              className="h-32 w-full"
              imageClassName="h-32 w-full"
              iconSize={28}
            />
          ) : null}

          <View className={cn("flex-1", dashboard && "p-3.5")}>
            {url ? (
              <View className="mb-1.5 flex-row items-center gap-1.5">
                {showFavicon ? (
                  <Image
                    source={{
                      uri: faviconUri,
                      headers: customHeadersFor(faviconUri),
                    }}
                    onError={() => setFaviconFailed(true)}
                    alt=""
                    className="h-4 w-4 rounded"
                  />
                ) : (
                  <Globe size={14} color={theme.neutral} />
                )}
                <Text
                  numberOfLines={1}
                  className="flex-1 text-xs font-medium text-neutral"
                >
                  {url}
                </Text>
              </View>
            ) : null}

            <Text
              numberOfLines={2}
              className="text-base font-semibold leading-5 text-base-content"
              style={dashboard ? { minHeight: 40 } : undefined}
            >
              {decode(link.name || link.description || link.url)}
            </Text>
            {link.description &&
            link.description.trim() &&
            link.description !== link.name ? (
              <Text
                numberOfLines={2}
                className="mt-1 text-xs leading-4 text-neutral"
              >
                {decode(link.description)}
              </Text>
            ) : null}

            <View className="mt-2.5 flex-row flex-wrap gap-1.5">
              {link.collection?.name ? (
                <View
                  className="max-w-full flex-row items-center gap-1 rounded-full px-2 py-0.5"
                  style={{ backgroundColor: withAlpha(collectionColor, 0.15) }}
                >
                  <Folder
                    size={11}
                    fill={collectionColor}
                    color={collectionColor}
                  />
                  <Text
                    numberOfLines={1}
                    className="text-xs font-medium text-base-content"
                  >
                    {link.collection.name}
                  </Text>
                </View>
              ) : null}
              {(link.tags || [])
                .slice(0, dashboard ? 2 : undefined)
                .map((tag) => (
                  <View
                    key={tag.id ?? tag.name}
                    className="rounded-full bg-base-100 px-2 py-0.5"
                  >
                    <Text
                      numberOfLines={1}
                      className="text-xs text-base-content"
                    >
                      #{tag.name}
                    </Text>
                  </View>
                ))}
              {dashboard && (link.tags?.length || 0) > 2 ? (
                <View className="rounded-full bg-base-100 px-2 py-0.5">
                  <Text className="text-xs text-neutral">
                    +{(link.tags?.length || 0) - 2}
                  </Text>
                </View>
              ) : null}
            </View>

            <View className="mt-2.5 flex-row items-center gap-1.5">
              <CalendarDays size={13} color={theme.neutral} />
              <Text numberOfLines={1} className="text-xs text-neutral">
                {new Date(link.createdAt as string).toLocaleString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
              {isPinned ? (
                <>
                  <View className="mx-0.5 h-1 w-1 rounded-full bg-neutral" />
                  <Pin size={13} color={theme.primary} fill={theme.primary} />
                  <Text className="text-xs font-medium text-primary">
                    Pinned
                  </Text>
                </>
              ) : null}
            </View>
          </View>

          {!dashboard ? (
            <Thumbnail
              link={link}
              preview={preview}
              faviconUri={showFavicon ? faviconUri : ""}
              onFaviconError={() => setFaviconFailed(true)}
              tintColor={theme.primary}
              className="h-[84px] w-[84px] rounded-xl"
              imageClassName="h-[84px] w-[84px]"
              iconSize={22}
            />
          ) : null}
        </Pressable>
      </ContextMenu.Trigger>

      <ContextMenu.Content avoidCollisions>
        <ContextMenu.Item
          key="open-original"
          onSelect={() => {
            if (link) {
              const format = getOriginalFormat(link);

              data.preferredBrowser === "app"
                ? router.navigate(
                    format !== null
                      ? `/links/${link.id}?format=${format}`
                      : `/links/${link.id}`
                  )
                : Linking.openURL(
                    format !== null
                      ? auth.instance +
                          `/preserved/${link?.id}?format=${format}`
                      : (link.url as string)
                  );
            }
          }}
        >
          <ContextMenu.ItemTitle>Open Original</ContextMenu.ItemTitle>
        </ContextMenu.Item>
        {link?.url && (
          <>
            <ContextMenu.Item
              key="copy-url"
              onSelect={async () => {
                await Clipboard.setStringAsync(link.url as string);
              }}
            >
              <ContextMenu.ItemTitle>Copy URL</ContextMenu.ItemTitle>
            </ContextMenu.Item>
          </>
        )}

        <ContextMenu.Item
          key="pin-link"
          onSelect={() => {
            const isAlreadyPinned =
              link?.pinnedBy && link.pinnedBy[0] ? true : false;

            updateLink.mutateAsync({
              ...link,
              pinnedBy: (isAlreadyPinned
                ? [{ id: undefined }]
                : [{ id: user?.id }]) as any,
            });
          }}
        >
          <ContextMenu.ItemTitle>
            {link.pinnedBy && link.pinnedBy[0] ? "Unpin Link" : "Pin Link"}
          </ContextMenu.ItemTitle>
        </ContextMenu.Item>

        <ContextMenu.Item
          key="link-details"
          onSelect={() => {
            SheetManager.show("link-details-sheet", {
              payload: { link },
            });
          }}
        >
          <ContextMenu.ItemTitle>Link Details</ContextMenu.ItemTitle>
        </ContextMenu.Item>

        <ContextMenu.Item
          key="edit-link"
          onSelect={() => {
            SheetManager.show("edit-link-sheet", {
              payload: { link: link },
            });
          }}
        >
          <ContextMenu.ItemTitle>Edit Link</ContextMenu.ItemTitle>
        </ContextMenu.Item>

        {link.url && atLeastOneFormatAvailable(link) && (
          <ContextMenu.Sub>
            <ContextMenu.SubTrigger key="preserved-formats">
              <ContextMenu.ItemTitle>Preserved Formats</ContextMenu.ItemTitle>
            </ContextMenu.SubTrigger>
            <ContextMenu.SubContent>
              {formatAvailable(link, "monolith") && (
                <ContextMenu.Item
                  key="preserved-formats-webpage"
                  onSelect={() =>
                    router.navigate(
                      `/links/${link.id}?format=${ArchivedFormat.monolith}`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>Webpage</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
              {formatAvailable(link, "image") && (
                <ContextMenu.Item
                  key="preserved-formats-screenshot"
                  onSelect={() =>
                    router.navigate(
                      `/links/${link.id}?format=${
                        link.image?.endsWith(".png")
                          ? ArchivedFormat.png
                          : ArchivedFormat.jpeg
                      }`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>Screenshot</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
              {formatAvailable(link, "pdf") && (
                <ContextMenu.Item
                  key="preserved-formats-pdf"
                  onSelect={() =>
                    router.navigate(
                      `/links/${link.id}?format=${ArchivedFormat.pdf}`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>PDF</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
              {formatAvailable(link, "readable") && (
                <ContextMenu.Item
                  key="preserved-formats-readable"
                  onSelect={() =>
                    router.navigate(
                      `/links/${link.id}?format=${ArchivedFormat.readability}`
                    )
                  }
                >
                  <ContextMenu.ItemTitle>Readable</ContextMenu.ItemTitle>
                </ContextMenu.Item>
              )}
            </ContextMenu.SubContent>
          </ContextMenu.Sub>
        )}

        <ContextMenu.Item
          key="delete-link"
          onSelect={() => {
            return Alert.alert(
              "Delete Link",
              "Are you sure you want to delete this link? This action cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: async () => {
                    deleteLink.mutate(link.id as number);

                    await deleteLinkCache(link.id as number);
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

type ThumbnailProps = {
  link: LinkIncludingShortenedCollectionAndTags;
  preview: string;
  faviconUri: string;
  onFaviconError: () => void;
  tintColor: string;
  className: string;
  imageClassName: string;
  iconSize: number;
};

/** Preview image with a tinted placeholder (favicon or globe) while none is available. */
const Thumbnail = ({
  link,
  preview,
  faviconUri,
  onFaviconError,
  tintColor,
  className,
  imageClassName,
  iconSize,
}: ThumbnailProps) => {
  const hasPreview = formatAvailable(link, "preview");
  const isPending = !hasPreview && !link.preview;

  if (hasPreview && preview) {
    return (
      <View className={cn("overflow-hidden", className)}>
        <Image
          key={String(link.updatedAt)}
          source={{ uri: preview }}
          alt=""
          resizeMode="cover"
          className={cn("scale-105", imageClassName)}
        />
      </View>
    );
  }

  return (
    <View
      className={cn("items-center justify-center overflow-hidden", className)}
      style={{ backgroundColor: withAlpha(tintColor, 0.1) }}
    >
      {isPending ? (
        <ActivityIndicator size="small" color={tintColor} />
      ) : faviconUri ? (
        <Image
          source={{ uri: faviconUri, headers: customHeadersFor(faviconUri) }}
          onError={onFaviconError}
          alt=""
          style={{ width: iconSize + 4, height: iconSize + 4, borderRadius: 6 }}
        />
      ) : (
        <Globe size={iconSize} color={withAlpha(tintColor, 0.7)} />
      )}
    </View>
  );
};

export default LinkListing;
