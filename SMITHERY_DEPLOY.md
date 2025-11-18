# Adverb Checker MCP Server for Smithery

Deploy your adverb detection tool as a fully self-contained MCP server on Smithery.ai!

## What This Does

This MCP server provides **100% accurate adverb detection** using a curated dictionary of 4,490+ adverbs from Open English WordNet. Everything runs directly on Smithery - no external API calls!

## Quick Setup

### 1. Initialize with Smithery

```bash
npx create-smithery@latest
```

When prompted:
- **Project name:** `adverb-checker-mcp`
- **Transport:** HTTP (Streamable)
- **Description:** "Detect adverbs in text with 100% accuracy"

### 2. Add Your Files

Your project structure should be:
```
adverb-checker-mcp/
├── src/
│   └── index.ts          ← Use the provided file
├── all_adverbs.txt       ← IMPORTANT: Add your adverbs list here!
├── package.json
├── tsconfig.json
└── README.md
```

**Copy these files:**
1. Replace `src/index.ts` with the provided `index.ts`
2. **Copy `all_adverbs.txt` to the project root** (same level as package.json)

### 3. Install Dependencies

```bash
npm install
```

### 4. Test Locally

```bash
npm run dev
```

This opens the Smithery Playground. Try asking:
> "Check this text for adverbs: She ran quickly and spoke softly."

### 5. Deploy to Smithery

1. **Create a GitHub repo:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/adverb-checker-mcp.git
   git push -u origin main
   ```

2. **Deploy on Smithery:**
   - Go to https://smithery.ai/new
   - Click "Deploy"
   - Connect your GitHub repo
   - Done! 🎉

### 6. Use It

Once deployed, you can:

**In Claude Desktop:**
Add to your config file:
```json
{
  "mcpServers": {
    "adverb-checker": {
      "url": "https://smithery.ai/YOUR_USERNAME/adverb-checker-mcp"
    }
  }
}
```

**In Web-based Claude:**
Use the connector URL provided by Smithery.

## How It Works

1. Server loads 4,490+ adverbs from `all_adverbs.txt` at startup
2. User sends text to check
3. Server detects adverbs using:
   - Multi-word phrase matching (longest first)
   - Single-word matching with smart punctuation handling
   - Overlap prevention for accurate counts
4. Results returned immediately - all processing is local!

## Benefits

- ✅ **Fully self-contained** - no external dependencies
- ✅ **Super fast** - no API calls, all processing local
- ✅ **100% reliable** - no cold starts or third-party downtime
- ✅ **Free hosting** on Smithery
- ✅ **Proper MCP protocol** - works with all MCP clients

## Architecture

```
[Claude/ChatGPT]
       ↓
[Smithery MCP Server] ← All-in-one: Protocol + Detection + Dictionary
```

**vs. the old way:**
```
[Claude/ChatGPT]
       ↓
[Smithery MCP Server]
       ↓
[Render Flask API] ← Extra layer, cold starts, more complexity
```

## Features

- **Smart punctuation handling**: Correctly identifies adverbs in "quickly.", "'tween'", "A.M.,"
- **Multi-word phrases**: Detects "a bit", "all of a sudden", "by and large"
- **Unicode normalization**: Handles smart quotes (', ", etc.)
- **Overlap prevention**: Accurate counts even with nested phrases

## Troubleshooting

**"Cannot find module all_adverbs.txt"**: Make sure you copied the file to the project root (not in src/)

**Deploy fails**: Verify all_adverbs.txt is committed to git (`git add all_adverbs.txt`)

**Tool not appearing**: Check Smithery dashboard for deployment logs
