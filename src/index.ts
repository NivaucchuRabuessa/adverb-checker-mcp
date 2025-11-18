import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFileSync } from "fs";
import { join } from "path";

// Load adverbs from file - read from project root
// This works with both ESM and CommonJS builds
const adverbsText = readFileSync(join(process.cwd(), "all_adverbs.txt"), "utf-8");
const allAdverbsList = adverbsText.split("\n").filter((line) => line.trim());

// Separate single-word and multi-word adverbs
const SINGLE_WORD_ADVERBS = new Set<string>();
const MULTI_WORD_ADVERBS: string[] = [];

for (const adverb of allAdverbsList) {
  if (adverb.includes(" ")) {
    MULTI_WORD_ADVERBS.push(adverb.toLowerCase());
  } else {
    SINGLE_WORD_ADVERBS.add(adverb.toLowerCase());
  }
}

// Sort multi-word adverbs by word count (longest first)
MULTI_WORD_ADVERBS.sort((a, b) => b.split(" ").length - a.split(" ").length);

// Helper function to normalize smart quotes
function normalizeQuotes(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"');
}

// Helper function to strip punctuation recursively
function normalizeWord(word: string): string | null {
  const normalized = normalizeQuotes(word);
  const sentencePunct = ".,!?;:\u2014\u2013";
  const wrapperPairs = [
    ["(", ")"],
    ["[", "]"],
    ["{", "}"],
    ['"', '"'],
  ];

  function tryMatch(candidate: string): string | null {
    if (candidate && SINGLE_WORD_ADVERBS.has(candidate.toLowerCase())) {
      return candidate;
    }
    return null;
  }

  function stripRecursively(candidate: string, depth: number = 0): string | null {
    if (depth > 10 || !candidate) return null;

    const match = tryMatch(candidate);
    if (match) return match;

    // Try removing wrapper pairs
    for (const [left, right] of wrapperPairs) {
      if (candidate.startsWith(left) && candidate.endsWith(right) && candidate.length > 2) {
        const result = stripRecursively(candidate.slice(1, -1), depth + 1);
        if (result) return result;
      }
    }

    // Try removing trailing punctuation
    if (candidate && sentencePunct.includes(candidate[candidate.length - 1])) {
      const result = stripRecursively(candidate.slice(0, -1), depth + 1);
      if (result) return result;
    }

    // Try removing leading punctuation
    if (candidate && sentencePunct.includes(candidate[0])) {
      const result = stripRecursively(candidate.slice(1), depth + 1);
      if (result) return result;
    }

    // Try removing trailing brackets/quotes
    if (candidate && '()[]{}"\'"'.includes(candidate[candidate.length - 1])) {
      const result = stripRecursively(candidate.slice(0, -1), depth + 1);
      if (result) return result;
    }

    // Try removing leading brackets/quotes
    if (candidate && '()[]{}"\'"'.includes(candidate[0])) {
      const result = stripRecursively(candidate.slice(1), depth + 1);
      if (result) return result;
    }

    return null;
  }

  return stripRecursively(normalized);
}

// Helper to check for overlaps
function overlaps(start1: number, end1: number, start2: number, end2: number): boolean {
  return !(end1 <= start2 || end2 <= start1);
}

// Main detection function
function checkAdverbs(text: string): { adverbs: string[]; count: number } {
  const found: string[] = [];
  const foundPositions: Array<[number, number]> = [];

  const normalizedText = normalizeQuotes(text);
  const textLower = normalizedText.toLowerCase();

  // Check for multi-word adverbs
  for (const multiAdverb of MULTI_WORD_ADVERBS) {
    const escaped = multiAdverb.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    let pattern = escaped;

    // Add word boundaries if starts/ends with alphanumeric
    if (/^[a-z0-9]/i.test(multiAdverb)) {
      pattern = `\\b${pattern}`;
    }
    if (/[a-z0-9]$/i.test(multiAdverb)) {
      pattern = `${pattern}\\b`;
    }

    const regex = new RegExp(pattern, "gi");
    let match;
    while ((match = regex.exec(textLower)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      const isOverlapping = foundPositions.some(([pos, posEnd]) =>
        overlaps(start, end, pos, posEnd)
      );
      if (!isOverlapping) {
        found.push(text.slice(start, end));
        foundPositions.push([start, end]);
      }
    }
  }

  // Check for single-word adverbs
  const words = text.split(/\s+/);
  let position = 0;
  for (const word of words) {
    const wordStart = text.indexOf(word, position);
    const wordEnd = wordStart + word.length;
    position = wordEnd;

    const isOverlapping = foundPositions.some(([pos, posEnd]) =>
      overlaps(wordStart, wordEnd, pos, posEnd)
    );
    if (!isOverlapping) {
      const normalized = normalizeWord(word);
      if (normalized) {
        found.push(word);
        foundPositions.push([wordStart, wordEnd]);
      }
    }
  }

  return { adverbs: found, count: found.length };
}

export default function createServer({ config }: { config?: any }) {
  const server = new McpServer({
    name: "Adverb Checker",
    version: "1.0.0",
  });

  // Register the adverb checking tool
  server.registerTool(
    "check_adverbs",
    {
      title: "Check Adverbs",
      description: "Check any text against the Open English WordNet dictionary",
      inputSchema: {
        text: z.string().describe("Any text"),
      },
    },
    async ({ text }) => {
      try {
        const result = checkAdverbs(text);
        const { adverbs, count } = result;

        if (count === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No adverbs found in the text.",
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: "text",
                text: `Found ${count} adverb(s): ${adverbs.join(", ")}`,
              },
            ],
          };
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error checking adverbs: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  return server.server;
}