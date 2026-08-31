import { delay } from "@linkwarden/lib/utils";
import { prisma } from "@linkwarden/prisma";
import { LinkWithCollectionOwnerAndTags } from "@linkwarden/types/global";
import autoTagLink, { hasAiTaggingProvider } from "../lib/autoTagLink";
import getLinkBatchFairly from "../lib/getLinkBatchFairly";

const AUTO_TAG_TAKE_COUNT = Number(process.env.ARCHIVE_TAKE_COUNT || "") || 1;

const isRateLimitError = (error: unknown) =>
  /quota|rate.?limit|429|RESOURCE_EXHAUSTED/i.test(String(error));

export async function autoTagPreservedLinks(interval = 10) {
  if (!hasAiTaggingProvider()) return;

  console.log("\x1b[34m%s\x1b[0m", "Starting preserved link auto-tagging...");

  while (true) {
    const links = await getLinkBatchFairly({
      maxBatchLinks: AUTO_TAG_TAKE_COUNT,
      mode: "tags",
    });

    if (links.length === 0) {
      await delay(interval);
      continue;
    }

    for (const link of links as LinkWithCollectionOwnerAndTags[]) {
      try {
        console.log(
          "\x1b[34m%s\x1b[0m",
          `Auto-tagging link ${link.url} for user ${link.collection.ownerId}.`
        );

        await autoTagLink(link.collection.owner, link.id);

        await prisma.link.update({
          where: { id: link.id },
          data: { aiTagged: true },
        });

        console.log(
          "\x1b[34m%s\x1b[0m",
          `Succeeded auto-tagging link ${link.url} for user ${link.collection.ownerId}.`
        );
        await delay(4);
      } catch (error: any) {
        console.error(
          "\x1b[34m%s\x1b[0m",
          `Error auto-tagging link ${link.url} for user ${link.collection.ownerId}:`,
          error
        );

        if (isRateLimitError(error)) {
          await delay(45);
          continue;
        }

        await prisma.link
          .update({
            where: { id: link.id },
            data: { aiTagged: true },
          })
          .catch((markError) => {
            console.error(
              "\x1b[34m%s\x1b[0m",
              `Error marking link ${link.id} as auto-tagged:`,
              markError
            );
          });
      }
    }

    await delay(interval);
  }
}
