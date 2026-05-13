---
name: mcp-builder
description: Build MCP (Model Context Protocol) servers that let Codex use external tools and APIs. Use when creating MCP servers, implementing MCP tools/resources/prompts, or integrating external services with Codex via MCP.
---

# MCP Server Builder

Build high-quality MCP servers that enable Codex to interact with external services.

## Four-Phase Process

### Phase 1: Plan
- Define what tools the LLM needs (prefer workflow tools over raw API coverage)
- Choose TypeScript (recommended) or Python
- Map out tool names, descriptions, inputs, outputs

### Phase 2: Implement

**TypeScript (recommended)**:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-service",
  version: "1.0.0",
});

server.tool(
  "get_user",
  "Fetch a user by ID from the service",
  { userId: z.string().describe("The user's unique identifier") },
  async ({ userId }) => {
    const user = await fetchUser(userId);
    return {
      content: [{ type: "text", text: JSON.stringify(user, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Python (FastMCP)**:
```python
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel

mcp = FastMCP("my-service")

@mcp.tool()
async def get_user(user_id: str) -> str:
    """Fetch a user by ID from the service."""
    user = await fetch_user(user_id)
    return json.dumps(user)

if __name__ == "__main__":
    mcp.run()
```

### Phase 3: Test
```bash
# Install MCP Inspector
npx @modelcontextprotocol/inspector

# Run against your server
npx @modelcontextprotocol/inspector node dist/index.js
```

### Phase 4: Create Evaluations
Write 10 realistic test prompts a user would actually ask. Each should:
- Require 1-3 tool calls to answer
- Be verifiable (has a correct answer)
- Be independent (no shared state)

## Tool Design Principles

### Good tool naming
```typescript
// ✅ Verb + noun, specific
"search_github_issues"
"create_calendar_event"
"send_slack_message"

// ❌ Too vague
"do_thing"
"api_call"
"process"
```

### Rich descriptions (critical for LLM performance)
```typescript
server.tool(
  "search_issues",
  `Search GitHub issues in a repository. Use this when the user wants to find bugs,
  feature requests, or discussions. Returns issue titles, numbers, status, and labels.
  Supports filtering by state (open/closed), labels, and date range.`,
  {
    repo: z.string().describe("Repository in 'owner/name' format, e.g. 'anthropics/Codex'"),
    query: z.string().describe("Search query text"),
    state: z.enum(["open", "closed", "all"]).default("open").describe("Filter by issue state"),
  },
  handler
);
```

### Error handling
```typescript
async (args) => {
  try {
    const result = await callAPI(args);
    return { content: [{ type: "text", text: JSON.stringify(result) }] };
  } catch (error) {
    // Return descriptive errors — the LLM uses them to self-correct
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message}. Try: ${getSuggestion(error)}`
      }],
      isError: true,
    };
  }
}
```

### Pagination support
```typescript
server.tool(
  "list_records",
  "List records with pagination",
  {
    limit: z.number().min(1).max(100).default(20),
    cursor: z.string().optional().describe("Pagination cursor from previous response"),
  },
  async ({ limit, cursor }) => {
    const { items, nextCursor } = await fetchPage(limit, cursor);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ items, nextCursor, hasMore: !!nextCursor })
      }]
    };
  }
);
```

## Project Structure

```
my-mcp-server/
├── src/
│   ├── index.ts          # Server entry point
│   ├── tools/
│   │   ├── search.ts
│   │   └── create.ts
│   └── client.ts         # API client wrapper
├── tests/
│   └── evals/            # 10 realistic test prompts
├── package.json
└── tsconfig.json
```

## package.json
```json
{
  "name": "my-mcp-server",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.7.0"
  }
}
```

## Codex Desktop Config
```json
{
  "mcpServers": {
    "my-service": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": { "API_KEY": "your-key" }
    }
  }
}
```

## Quality Checklist
- [ ] All tools have rich, specific descriptions
- [ ] Input schemas use `.describe()` on every field
- [ ] Errors return helpful messages, not stack traces
- [ ] Sensitive data (API keys) via environment variables
- [ ] Pagination for list operations
- [ ] Rate limiting handled gracefully
- [ ] Tested with MCP Inspector before shipping
