export const generateTagsPrompt = (
  text: string,
  collections: string[] = []
) => `
You are an expert Bookmark Manager and news classifier. Analyze this webpage and:
1. Segment it into a topical collection (one folder name).
2. Generate 3-5 categorical tags.

${
  collections.length
    ? `EXISTING COLLECTIONS: ${collections.join(", ")}
Prefer an existing collection when it fits. Only invent a new collection name if none match.`
    : `Collection names should be short topic folders (1-3 words), Title Case.`
}

STRICT RULES:
1. Output ONLY JSON: {"collection":"Name","tags":["Tag1","Tag2","Tag3"]}
2. Use Title Case for tags and collection (e.g. "Machine Learning", "World News")
3. Acronyms in UPPERCASE (AI, API, ML, LLM, CSS, HTML, SQL, AWS, EU, NATO)
4. Use established category names, not actions or verbs
5. Maximum 2 words per tag
6. Avoid: verbs (read, view, sign), UI elements (sign up, login), vague words (thing, stuff)
7. Prefer: nouns representing topics, technologies, industries, domains, beats
8. Tags and collection must be in the language of the text
9. Do not use Unorganized or Uncategorized as the collection

EXAMPLES:
✓ {"collection":"World News","tags":["Elections","Europe","Politics"]}
✗ {"collection":"Unorganized","tags":["read","Sign Up","thing"]}

Text: ${text}

JSON:`;

export const predefinedTagsPrompt = (
  text: string,
  tags: string[],
  collections: string[] = []
) => `
You are an expert Bookmark Manager and news classifier. Match this webpage to predefined tags and a collection.

PREDEFINED TAGS: ${tags.join(", ")}
${collections.length ? `EXISTING COLLECTIONS: ${collections.join(", ")}` : ""}

STRICT RULES:
1. Output ONLY JSON: {"collection":"Name","tags":["Tag1","Tag2","Tag3"]}
2. Select 3-5 tags from the predefined list above
3. Choose tags that accurately describe the content's main topics
4. Match the EXACT capitalization from the predefined list
5. If no tags match well, return fewer tags (minimum 1)
6. Do not create new tags - only use the predefined ones
7. Collection: prefer an existing collection name when it fits; otherwise a short Title Case topic
8. Do not use Unorganized or Uncategorized as the collection

Text: ${text}

JSON:`;

export const existingTagsPrompt = (
  text: string,
  tags: string[],
  collections: string[] = []
) => `
You are an expert Bookmark Manager and news classifier. Match this webpage to existing tags and a collection.

EXISTING TAGS (sorted by usage): ${tags.join(", ")}
${collections.length ? `EXISTING COLLECTIONS: ${collections.join(", ")}` : ""}

STRICT RULES:
1. Output ONLY JSON: {"collection":"Name","tags":["Tag1","Tag2","Tag3"]}
2. Select 3-5 tags from the existing tags above
3. Prefer frequently-used tags (earlier in the list) when equally relevant
4. Match the EXACT capitalization from the existing tags
5. Choose tags that accurately describe the content's main topics
6. If no tags match well, return fewer tags (minimum 1)
7. Do not create new tags - only reuse existing ones
8. Collection: pick from existing collections when possible
9. Do not use Unorganized or Uncategorized as the collection

Text: ${text}

JSON:`;
