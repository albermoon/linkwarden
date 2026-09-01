import { FlatList, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import DashboardItem from "@/components/DashboardItem";
import { rawTheme, ThemeName } from "@/lib/colors";
import {
  Clock8,
  ChevronRight,
  Pin,
  Folder,
  Hash,
  Link,
} from "lucide-react-native";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import LinkListing from "@/components/LinkListing";
import IconBadge from "@/components/ui/IconBadge";
import { useColorScheme } from "nativewind";
import { useRouter } from "expo-router";

// Don't use prisma client's DashboardSectionType, it'll crash in production (React Native)
type DashboardSectionType =
  | "STATS"
  | "RECENT_LINKS"
  | "PINNED_LINKS"
  | "COLLECTION";

type DashboardSectionProps = {
  sectionData: { type: DashboardSectionType };
  collection?: any;
  links?: any[];
  numberOfTags: number;
  numberOfLinks: number;
  collectionsLength: number;
  numberOfPinnedLinks: number;
  dashboardData: {
    isLoading: boolean;
    refetch: Function;
    isRefetching: boolean;
  };
  collectionLinks?: any[];
};

const STAT_COLORS = {
  links: "#8B5CF6",
  collections: "#0EA5E9",
  tags: "#10B981",
  pinned: "#F59E0B",
};

const DashboardSection: React.FC<DashboardSectionProps> = ({
  sectionData,
  collection,
  links = [],
  numberOfTags,
  numberOfLinks,
  collectionsLength,
  numberOfPinnedLinks,
  dashboardData,
  collectionLinks = [],
}) => {
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];

  const router = useRouter();

  switch (sectionData.type) {
    case "STATS":
      return (
        <View className="flex-col gap-3 max-w-full px-5">
          <View className="flex-row gap-3">
            <DashboardItem
              name={numberOfLinks === 1 ? "Link" : "Links"}
              value={numberOfLinks}
              icon={<Link size={20} color={STAT_COLORS.links} />}
              color={STAT_COLORS.links}
            />
            <DashboardItem
              name={collectionsLength === 1 ? "Collection" : "Collections"}
              value={collectionsLength}
              icon={
                <Folder
                  size={20}
                  color={STAT_COLORS.collections}
                  fill={STAT_COLORS.collections}
                />
              }
              color={STAT_COLORS.collections}
            />
          </View>
          <View className="flex-row gap-3">
            <DashboardItem
              name={numberOfTags === 1 ? "Tag" : "Tags"}
              value={numberOfTags}
              icon={<Hash size={20} color={STAT_COLORS.tags} />}
              color={STAT_COLORS.tags}
            />
            <DashboardItem
              name={"Pinned Links"}
              value={numberOfPinnedLinks}
              icon={
                <Pin
                  size={20}
                  color={STAT_COLORS.pinned}
                  fill={STAT_COLORS.pinned}
                />
              }
              color={STAT_COLORS.pinned}
            />
          </View>
        </View>
      );

    case "RECENT_LINKS":
      return (
        <View className="gap-3">
          <SectionHeader
            title="Recent Links"
            icon={<Clock8 size={17} color={theme.primary} />}
            color={theme.primary}
            onViewAll={() => router.navigate("/(tabs)/dashboard/recent-links")}
          />

          {dashboardData.isLoading ||
          (links.length > 0 && !dashboardData.isLoading) ? (
            <HorizontalLinks
              links={links || []}
              refreshing={dashboardData.isLoading}
            />
          ) : (
            <EmptySection
              title="No recent links"
              hint="Links you save will show up here."
              icon={<Clock8 size={22} color={theme.primary} />}
              color={theme.primary}
            />
          )}
        </View>
      );

    case "PINNED_LINKS":
      return (
        <View className="gap-3">
          <SectionHeader
            title="Pinned Links"
            icon={<Pin size={17} color={theme.primary} fill={theme.primary} />}
            color={theme.primary}
            onViewAll={() => router.navigate("/(tabs)/dashboard/pinned-links")}
          />

          {dashboardData.isLoading ||
          links?.some((e: any) => e.pinnedBy && e.pinnedBy[0]) ? (
            <HorizontalLinks
              links={
                links.filter((e: any) => e.pinnedBy && e.pinnedBy[0]) || []
              }
              refreshing={dashboardData.isLoading}
            />
          ) : (
            <EmptySection
              title="No pinned links"
              hint="Long-press a link and choose “Pin Link”."
              icon={<Pin size={22} color={theme.primary} />}
              color={theme.primary}
            />
          )}
        </View>
      );

    case "COLLECTION": {
      if (!collection?.id) return null;
      const color = collection.color || "#0ea5e9";

      return (
        <View className="gap-3">
          <SectionHeader
            title={collection.name}
            icon={<Folder size={17} fill={color} color={color} />}
            color={color}
            onViewAll={() =>
              router.navigate(
                `/(tabs)/dashboard/collection?collectionId=${collection.id}`
              )
            }
          />

          {dashboardData.isLoading || collectionLinks.length > 0 ? (
            <HorizontalLinks
              links={collectionLinks || []}
              refreshing={dashboardData.isLoading}
            />
          ) : (
            <EmptySection
              title="Empty collection"
              hint="Add a link to this collection to see it here."
              icon={<Folder size={22} fill={color} color={color} />}
              color={color}
            />
          )}
        </View>
      );
    }

    default:
      return null;
  }
};

export default DashboardSection;

const SectionHeader = ({
  title,
  icon,
  color,
  onViewAll,
}: {
  title: string;
  icon: React.ReactNode;
  color: string;
  onViewAll: () => void;
}) => {
  const { colorScheme } = useColorScheme();
  const theme = rawTheme[colorScheme as ThemeName];

  return (
    <View className="flex-row items-center justify-between px-5">
      <View className="flex-1 flex-row items-center gap-2.5 pr-3">
        <IconBadge color={color} size={32} radius={10}>
          {icon}
        </IconBadge>
        <Text
          className="flex-1 text-xl font-semibold text-base-content"
          numberOfLines={1}
        >
          {title}
        </Text>
      </View>
      <TouchableOpacity
        className="flex-row items-center gap-0.5 rounded-full bg-base-200 py-1.5 pl-3 pr-2"
        activeOpacity={0.7}
        onPress={onViewAll}
      >
        <Text className="text-sm font-medium text-primary">View all</Text>
        <ChevronRight size={15} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
};

const EmptySection = ({
  title,
  hint,
  icon,
  color,
}: {
  title: string;
  hint: string;
  icon: React.ReactNode;
  color: string;
}) => (
  <View className="mx-5 items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-content px-8 py-8">
    <IconBadge color={color} size={44} radius={22} tint={0.12}>
      {icon}
    </IconBadge>
    <Text className="mt-1 text-center text-base font-semibold text-base-content">
      {title}
    </Text>
    <Text className="text-center text-sm text-neutral">{hint}</Text>
  </View>
);

const HorizontalLinks = ({
  links,
  refreshing,
}: {
  links: LinkIncludingShortenedCollectionAndTags[];
  refreshing: boolean;
}) => (
  <FlatList
    horizontal
    showsHorizontalScrollIndicator={false}
    directionalLockEnabled
    data={links}
    refreshing={refreshing}
    initialNumToRender={2}
    keyExtractor={(item) => item.id?.toString() || ""}
    renderItem={({ item }) => <RenderItem item={item} />}
    ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
    contentContainerStyle={{
      paddingHorizontal: 20,
    }}
  />
);

const RenderItem = React.memo(
  ({ item }: { item: LinkIncludingShortenedCollectionAndTags }) => {
    return <LinkListing link={item} dashboard />;
  }
);
RenderItem.displayName = "DashboardLinkRenderItem";
