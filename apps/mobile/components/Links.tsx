import {
  View,
  FlatList,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import LinkListing from "@/components/LinkListing";
import EmptyState from "@/components/EmptyState";
import React, { useState } from "react";
import { LinkIncludingShortenedCollectionAndTags } from "@linkwarden/types/global";
import Spinner from "@/components/ui/Spinner";
import { rawTheme, ThemeName } from "@/lib/colors";
import { useColorScheme } from "nativewind";
import { useQueryClient } from "@tanstack/react-query";
import { resetInfiniteQueryPagination } from "@linkwarden/router/lib";

const RenderItem = React.memo(
  ({ item }: { item: LinkIncludingShortenedCollectionAndTags }) => {
    return <LinkListing link={item} />;
  }
);
RenderItem.displayName = "LinkRenderItem";

type Props = {
  links: LinkIncludingShortenedCollectionAndTags[];
  data: any;
};

export default function Links({ links, data }: Props) {
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();
  const [promptedRefetch, setPromptedRefetch] = useState(false);

  const refreshControl = (
    <Spinner
      refreshing={data.isRefetching && promptedRefetch}
      onRefresh={async () => {
        setPromptedRefetch(true);
        await resetInfiniteQueryPagination(queryClient, ["links"]);
        setPromptedRefetch(false);
      }}
      progressBackgroundColor={rawTheme[colorScheme as ThemeName].neutral}
      colors={[rawTheme[colorScheme as ThemeName]["base-content"]]}
    />
  );

  return data.isLoading ? (
    <View className="flex justify-center h-screen items-center">
      <ActivityIndicator size="large" />
      <Text className="text-base mt-2.5 text-neutral">Loading...</Text>
    </View>
  ) : (links?.length ?? 0) === 0 ? (
    <EmptyState refreshControl={refreshControl} />
  ) : (
    <FlatList
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={listStyles.content}
      ListHeaderComponent={() => <></>}
      data={links || []}
      refreshControl={refreshControl}
      refreshing={data.isRefetching && promptedRefetch}
      initialNumToRender={4}
      keyExtractor={(item) => item.id?.toString() || ""}
      renderItem={({ item }) => (
        <RenderItem item={item} key={item.id?.toString()} />
      )}
      onEndReached={() => data.fetchNextPage()}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        data.isFetchingNextPage ? (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
    />
  );
}

const listStyles = StyleSheet.create({
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
});
