import { AiTaggingMethod, User } from "@linkwarden/prisma/client";
import {
  existingTagsPrompt,
  generateTagsPrompt,
  predefinedTagsPrompt,
} from "./prompts";
import { prisma } from "@linkwarden/prisma";
import { generateObject, generateText } from "ai";
import { LanguageModelV2 } from "@ai-sdk/provider";
import {
  createOpenAICompatible,
  OpenAICompatibleProviderSettings,
} from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { perplexity } from "@ai-sdk/perplexity";
import { azure } from "@ai-sdk/azure";
import { anthropic } from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider-v2";
import { titleCase } from "@linkwarden/lib/utils";
import { createFolder } from "@linkwarden/filesystem";
import { z } from "zod";

const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite";

const classificationSchema = z.object({
  collection: z.string().min(1).max(50),
  tags: z.array(z.string()).min(1).max(5),
  kind: z.enum(["comment", "repository", "article", "other"]).optional(),
  description: z.string().max(2048).optional(),
});

type Classification = z.infer<typeof classificationSchema>;

const RESERVED_COLLECTIONS = new Set(["unorganized", "uncategorized"]);

const ensureValidURL = (base: string, path: string) =>
  `${base.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

export const hasAiTaggingProvider = () =>
  Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL ||
      process.env.OPENAI_API_KEY ||
      process.env.AZURE_API_KEY ||
      process.env.ANTHROPIC_API_KEY ||
      process.env.OPENROUTER_API_KEY ||
      process.env.PERPLEXITY_API_KEY
  );

const getAIModel = (): LanguageModelV2 => {
  const geminiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

  if (geminiKey) {
    const google = createGoogleGenerativeAI({ apiKey: geminiKey });
    return google(process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL);
  }
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL) {
    let config: OpenAICompatibleProviderSettings = {
      baseURL:
        process.env.CUSTOM_OPENAI_BASE_URL || "https://api.openai.com/v1",
      name: process.env.CUSTOM_OPENAI_NAME || "openai",
      apiKey: process.env.OPENAI_API_KEY,
    };

    const openaiCompatibleModel = createOpenAICompatible(config);

    return openaiCompatibleModel(process.env.OPENAI_MODEL);
  }
  if (
    process.env.AZURE_API_KEY &&
    process.env.AZURE_RESOURCE_NAME &&
    process.env.AZURE_MODEL
  )
    return azure(process.env.AZURE_MODEL);
  if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_MODEL)
    return anthropic(process.env.ANTHROPIC_MODEL);
  if (process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL && process.env.OLLAMA_MODEL) {
    const ollama = createOllama({
      baseURL: ensureValidURL(
        process.env.NEXT_PUBLIC_OLLAMA_ENDPOINT_URL,
        "api"
      ),
    });

    return ollama(process.env.OLLAMA_MODEL);
  }
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_MODEL) {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    return openrouter(process.env.OPENROUTER_MODEL) as LanguageModelV2;
  }
  if (process.env.PERPLEXITY_API_KEY) {
    return perplexity(process.env.PERPLEXITY_MODEL || "sonar-pro");
  }
  throw new Error("No AI provider configured");
};

const hostnameLabel = (url?: string | null) => {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
};

const CODE_HOSTS = new Set([
  "github.com",
  "gitlab.com",
  "bitbucket.org",
  "codeberg.org",
  "sr.ht",
  "sourceforge.net",
]);

const isCodeRepositoryUrl = (url?: string | null) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (!CODE_HOSTS.has(host) || parts.length < 2) return false;
    if (host === "github.com") {
      return ![
        "topics",
        "settings",
        "orgs",
        "marketplace",
        "features",
        "pricing",
        "about",
        "login",
        "signup",
      ].includes(parts[0]);
    }
    return true;
  } catch {
    return false;
  }
};

const isSocialCommentUrl = (url?: string | null) => {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname;
    if (
      host === "x.com" ||
      host === "twitter.com" ||
      host === "mobile.twitter.com"
    ) {
      return path.includes("/status/");
    }
    if (host === "reddit.com" || host.endsWith(".reddit.com")) return true;
    if (host === "threads.net" || host === "bsky.app") return true;
    return false;
  } catch {
    return false;
  }
};

const fallbackCollectionForUrl = (url?: string | null) => {
  const host = hostnameLabel(url);
  if (isCodeRepositoryUrl(url)) {
    if (host.includes("gitlab")) return "GitLab";
    if (host.includes("bitbucket")) return "Bitbucket";
    if (host.includes("codeberg")) return "Codeberg";
    return "GitHub";
  }
  if (isSocialCommentUrl(url)) {
    if (host.includes("reddit")) return "Reddit";
    if (host.includes("bsky")) return "Bluesky";
    if (host.includes("threads")) return "Threads";
    return "X";
  }
  return "";
};

const buildPageText = (link: {
  name?: string | null;
  url?: string | null;
  metaDescription?: string | null;
  textContent?: string | null;
}) => {
  const body =
    link.textContent?.replace(/\s+/g, " ").trim().slice(0, 3500) ||
    link.metaDescription ||
    "";
  const source = hostnameLabel(link.url);
  const hints = [
    isCodeRepositoryUrl(link.url)
      ? "Page type hint: CODE REPOSITORY. Put it in GitHub/GitLab/Repositorios and summarize what the repo does."
      : "",
    isSocialCommentUrl(link.url)
      ? "Page type hint: SOCIAL COMMENT or post (tweet/reply). In description, summarize the MAIN tweet/post and what this comment is about."
      : "",
  ].filter(Boolean);

  return [
    link.name ? `Title: ${link.name}` : "",
    source ? `Source: ${source}` : "",
    link.url ? `URL: ${link.url}` : "",
    ...hints,
    body ? `Content: ${body}` : "",
  ]
    .filter(Boolean)
    .join("\n");
};

const parseClassification = (text: string): Classification => {
  const raw = text.match(/```json\s*([\s\S]*?)\s*```/i)?.[1] ?? text;
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return classificationSchema.parse({
      collection: "News",
      tags: parsed,
      description: "",
    });
  }

  return classificationSchema.parse(parsed);
};

const isRateLimitError = (error: unknown) =>
  /quota|rate.?limit|429|RESOURCE_EXHAUSTED/i.test(String(error));

const classifyLink = async (
  prompt: string
): Promise<Classification | null> => {
  const model = getAIModel();

  try {
    const { object } = await generateObject({
      model,
      schema: classificationSchema,
      prompt,
      maxRetries: 1,
    });
    return object;
  } catch (error) {
    if (isRateLimitError(error)) throw error;
    const { text } = await generateText({
      model,
      prompt,
      maxRetries: 1,
    });
    try {
      return parseClassification(text);
    } catch {
      return null;
    }
  }
};

const assignCollection = async ({
  user,
  linkId,
  currentCollectionId,
  collectionName,
  canCreate,
  existingNames,
}: {
  user: User;
  linkId: number;
  currentCollectionId: number;
  collectionName?: string;
  canCreate: boolean;
  existingNames: { id: number; name: string }[];
}) => {
  const requested = collectionName?.trim().slice(0, 50);
  if (!requested || RESERVED_COLLECTIONS.has(requested.toLowerCase())) return;

  const match = existingNames.find(
    (collection) => collection.name.toLowerCase() === requested.toLowerCase()
  );

  if (match) {
    if (match.id === currentCollectionId) return;
    await prisma.link.update({
      where: { id: linkId },
      data: { collectionId: match.id },
    });
    return;
  }

  if (!canCreate) return;

  const created = await prisma.collection.create({
    data: {
      name: requested,
      ownerId: user.id,
      createdById: user.id,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { collectionOrder: { push: created.id } },
  });

  createFolder({ filePath: `archives/${created.id}` });
  createFolder({ filePath: `archives/preview/${created.id}` });

  await prisma.link.update({
    where: { id: linkId },
    data: { collectionId: created.id },
  });
};

export default async function autoTagLink(user: User, linkId: number) {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
  });

  if (!link) return console.log("Link not found for auto tagging.");

  const description = buildPageText(link);

  if (!description) return;

  const existingCollections = await prisma.collection.findMany({
    where: { ownerId: user.id },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
  const collectionNames = existingCollections.map((collection) =>
    collection.name.length > 50
      ? collection.name.slice(0, 47) + "..."
      : collection.name
  );

  let prompt;

  let existingTagsNames: string[] = [];

  if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
    const existingTags = await prisma.tag.findMany({
      select: {
        name: true,
        _count: {
          select: { links: true },
        },
      },
      where: {
        ownerId: user.id,
      },
      orderBy: {
        links: {
          _count: "desc",
        },
      },
      take: 50,
    });

    existingTagsNames = existingTags.map((tag) =>
      tag.name.length > 50 ? tag.name.slice(0, 47) + "..." : tag.name
    );
  }

  if (user.aiTaggingMethod === AiTaggingMethod.GENERATE) {
    prompt = generateTagsPrompt(description, collectionNames);
  } else if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
    prompt = existingTagsPrompt(
      description,
      existingTagsNames,
      collectionNames
    );
  } else {
    prompt = predefinedTagsPrompt(
      description,
      user.aiPredefinedTags,
      collectionNames
    );
  }

  if (
    user.aiTaggingMethod === AiTaggingMethod.PREDEFINED &&
    user.aiPredefinedTags.length === 0
  ) {
    return console.log("No predefined tags to auto tag for link: ", link.url);
  }

  const classified = await classifyLink(prompt);

  if (!classified) {
    console.log("Error auto tagging link: ", link.url);
    return;
  }

  try {
    let tags = classified.tags;

    if (!tags || tags.length === 0) {
      return;
    } else if (user.aiTaggingMethod === AiTaggingMethod.EXISTING) {
      tags = tags.filter((tag: string) => existingTagsNames.includes(tag));
    } else if (user.aiTaggingMethod === AiTaggingMethod.PREDEFINED) {
      tags = tags.filter((tag: string) => user.aiPredefinedTags.includes(tag));
    } else if (user.aiTaggingMethod === AiTaggingMethod.GENERATE) {
      tags = tags.map((tag: string) =>
        tag.length > 3 ? titleCase(tag.toLowerCase()) : tag
      );
    }

    if (tags.length > 5) {
      tags = tags.slice(0, 5);
    }

    const collectionName =
      classified.collection &&
      !RESERVED_COLLECTIONS.has(classified.collection.toLowerCase())
        ? classified.collection
        : fallbackCollectionForUrl(link.url);

    const summary = classified.description?.trim().slice(0, 2048) || "";
    const shouldWriteDescription =
      Boolean(summary) &&
      (!link.description?.trim() ||
        classified.kind === "comment" ||
        classified.kind === "repository");

    console.log(
      "Classification for link:",
      link.url,
      "=>",
      collectionName,
      tags,
      classified.kind || "",
      summary ? `desc:${summary.slice(0, 80)}` : ""
    );

    await prisma.link.update({
      where: { id: linkId },
      data: {
        tags: {
          connectOrCreate: tags.map((tag: string) => ({
            where: {
              name_ownerId: {
                name: tag.trim().slice(0, 50),
                ownerId: user.id,
              },
            },
            create: {
              name: tag.trim().slice(0, 50),
              owner: {
                connect: {
                  id: user.id,
                },
              },
              aiGenerated: true,
            },
          })),
        },
        aiTagged: true,
        ...(shouldWriteDescription ? { description: summary } : {}),
      },
    });

    await assignCollection({
      user,
      linkId,
      currentCollectionId: link.collectionId,
      collectionName,
      canCreate: user.aiTaggingMethod === AiTaggingMethod.GENERATE,
      existingNames: existingCollections,
    });
  } catch (err) {
    console.log("Error auto tagging link: ", link.url);
    console.log("Error: ", err);
  }
}
