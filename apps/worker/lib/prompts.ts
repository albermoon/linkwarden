export const generateTagsPrompt = (
  text: string,
  collections: string[] = []
) => `
You are an expert Bookmark Manager and news classifier. Analyze this webpage and:
1. Put it in a collection based on WHERE IT COMES FROM.
2. Generate 3-5 topical tags.
3. If it is a comment/reply (X/Twitter, Reddit, etc.), write a short description summarizing the MAIN tweet/post and what the comment is about.
4. If it is a code repository (GitHub, GitLab, etc.), put it in GitHub/GitLab/Repositorios and summarize what the repo does.

${
  collections.length
    ? `EXISTING COLLECTIONS: ${collections.join(", ")}
Reuse an existing collection when the origin or topic matches. Only invent a new collection if none match.`
    : `Collection names should be short origin folders (1-3 words), Title Case.`
}

STRICT RULES:
1. Output ONLY JSON: {"kind":"comment|repository|article|other","collection":"Name","tags":["Tag1","Tag2"],"description":"..."}
2. kind=comment for tweet replies, Reddit comments, Threads/Bluesky replies. description = 2-4 sentences: what the MAIN tweet/post is about, then what this comment adds. Language of the text.
3. kind=repository for GitHub/GitLab/Bitbucket/Codeberg repos. collection = GitHub, GitLab, or Repositorios. description = 1-2 sentences on what the project does.
4. kind=article for news/blogs. description can be empty.
5. Collection = origin/source folder. For comments use X, Twitter, Reddit. For repos use GitHub/GitLab/Repositorios.
6. Always set a collection. Never Unorganized or Uncategorized
7. Tags = 3-5 topics, Title Case, max 2 words each
8. Acronyms in UPPERCASE (AI, API, ML, LLM, CSS, HTML, SQL, AWS, EU, NATO)
9. Tags, collection, and description must be in the language of the text
10. description max 400 characters. Empty string if not comment/repository.

EXAMPLES:
✓ {"kind":"comment","collection":"X","tags":["Politics","Spain","Reply"],"description":"El tweet principal habla de las nuevas medidas del gobierno. Este comentario responde criticando el impacto en el comercio."}
✓ {"kind":"repository","collection":"GitHub","tags":["TypeScript","CLI","Open Source"],"description":"CLI en TypeScript para gestionar bookmarks y sincronizar colecciones."}
✓ {"kind":"article","collection":"BBC","tags":["Europe","Politics","Elections"],"description":""}

Text: ${text}

JSON:`;

export const predefinedTagsPrompt = (
  text: string,
  tags: string[],
  collections: string[] = []
) => `
You are an expert Bookmark Manager. Match this webpage to predefined tags, a collection of origin, and a short description when it is a comment or a code repo.

PREDEFINED TAGS: ${tags.join(", ")}
${collections.length ? `EXISTING COLLECTIONS: ${collections.join(", ")}` : ""}

STRICT RULES:
1. Output ONLY JSON: {"kind":"comment|repository|article|other","collection":"Name","tags":["Tag1","Tag2"],"description":"..."}
2. Select 3-5 tags from the predefined list above
3. Comments: summarize the MAIN tweet/post in description. Repos: collection GitHub/GitLab/Repositorios and summarize the project
4. Collection = where it comes from. Always set one. Never Unorganized
5. description empty unless kind is comment or repository

Text: ${text}

JSON:`;

export const existingTagsPrompt = (
  text: string,
  tags: string[],
  collections: string[] = []
) => `
You are an expert Bookmark Manager. Match this webpage to existing tags, a collection of origin, and a short description when it is a comment or a code repo.

EXISTING TAGS (sorted by usage): ${tags.join(", ")}
${collections.length ? `EXISTING COLLECTIONS: ${collections.join(", ")}` : ""}

STRICT RULES:
1. Output ONLY JSON: {"kind":"comment|repository|article|other","collection":"Name","tags":["Tag1","Tag2"],"description":"..."}
2. Select 3-5 tags from the existing tags above
3. Comments: summarize the MAIN tweet/post in description. Repos: collection GitHub/GitLab/Repositorios and summarize the project
4. Collection = where it comes from. Always set one. Never Unorganized
5. description empty unless kind is comment or repository

Text: ${text}

JSON:`;
