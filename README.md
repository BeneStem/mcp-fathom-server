# MCP Fathom Server

An MCP (Model Context Protocol) server for the Fathom AI meeting API. Stdio transport, API-key auth, runs locally.

![MCP](https://img.shields.io/badge/MCP-Compatible-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)

## Why this server vs the official Fathom MCP

Fathom ships a hosted MCP at `https://api.fathom.ai/mcp` (OAuth, multi-tenant). This server is a self-hosted stdio alternative with intentional differences:

**What this server does that the official one doesn't:**

1. **Public share URLs.** Returns `share_url` (`fathom.video/share/...`) instead of the auth-gated `/calls/...` URL the official MCP exposes. Links you paste actually work for non-Fathom users.
2. **Webhook lifecycle.** `create_webhook` and `delete_webhook` tools — the official MCP is read-only.
3. **`list_team_members`.** Discover who's on each team, not just team names.
4. **Inline batch fetching.** The official MCP cannot use `include_summary` / `include_transcript` on `list_meetings` (OAuth restriction documented in their OpenAPI spec) — it must make N+1 calls. This server's API-key auth lets you fetch up to 50 meetings + summaries in one call.
5. **`include_crm_matches`.** Pull CRM contacts/companies/deals attached to meetings.
6. **`date_range` shortcut.** Pass `'today'`, `'last_week'`, etc. instead of crafting ISO timestamps.
7. **Custom server instructions.** Ships an `instructions` field that trains the agent on grounding rules, tool composition, and the `find_person` honesty caveat (below).

**Honest limitation vs the official server:**

- **`find_person` does NOT search the transcript-speaker index.** The official MCP can find people who appear only as transcript speakers; this server can only find people from your team roster (`list_team_members`) and calendar invitees from your recent meetings. For exhaustive person lookups across all transcripts, use the official Fathom MCP.

**Scope:** The Fathom API key this server uses is **user-scoped**. Every tool returns only meetings you personally recorded. There is no `"anyone"` org-wide scope.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- A Fathom AI account with API access
- Claude Desktop app

### Installation

1. **Clone and setup**:
```bash
git clone https://github.com/sourcegate/mcp-fathom-server.git
cd mcp-fathom-server
npm install
npm run build
```

2. **Configure your API key**:
```bash
cp .env.example .env
# Edit .env and add your Fathom API key
```

3. **Get your Fathom API key**:
   - Log in to [Fathom](https://app.fathom.video)
   - Go to Settings → API
   - Generate a new API key
   - Copy it to your `.env` file

4. **Add to Claude Desktop**:

Edit your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "fathom": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-fathom-server/dist/index.js"],
      "env": {
        "FATHOM_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

5. **Restart Claude Desktop** and you're ready to go! 🎉

## 💬 Usage Examples

Once configured, you can ask Claude natural language questions about your meetings:

```
"Find me meetings about recruiting"
"Show me all external meetings from last week"  
"Search for meetings where we discussed product launches"
"List meetings with john@example.com"
"Find meetings with action items about hiring"
"What did we discuss in our Q1 planning meetings?"
```

Claude will automatically choose the right tool and search method based on your query.

## 🔧 Available Tools

| Tool | Purpose |
|------|---------|
| `list_meetings` | Filter meetings by date / attendees / teams / recorder. Optional inline summary, transcript, action items, CRM matches. Auto-paginates up to `response_limit` (default 50); returns `next_cursor` when more exist. |
| `search_meetings` | AND-logic keyword search across titles + summaries (and optionally action items / transcripts). Scans up to `max_pages × 25` meetings (default ~250). Param: `query`. |
| `get_meeting_summary` | AI summary for a `recording_id`. |
| `get_meeting_transcript` | Full transcript for a `recording_id`. Pass `url` to receive `[MM:SS](url?timestamp=N)` deep-links per speaker segment. |
| `list_teams` | Discover team names for filtering. |
| `list_team_members` | Discover who's on each team. **Not in the official MCP.** |
| `find_person` | Find a person across team roster + recent meeting invitees. **See limitation above** — this does NOT search the transcript-speaker index. |
| `create_webhook` | Register a webhook for new-meeting events. **Not in the official MCP.** |
| `delete_webhook` | Remove a webhook by ID. **Not in the official MCP.** |

## 🛠️ Development

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector dist/index.js
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| **Server won't start** | Check that your API key is correctly set |
| **No results found** | Try broader search terms or check your API key permissions |
| **Rate limiting** | The server handles this automatically - wait a moment and try again |
| **Claude can't find tools** | Ensure Claude Desktop is restarted after config changes |

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## 🙋‍♀️ Support

If you encounter any issues:
1. Check the [troubleshooting section](#-troubleshooting)
2. Search existing [GitHub issues](https://github.com/sourcegate/mcp-fathom-server/issues)
3. Create a new issue with detailed information about your problem

---

**Status**: Tested and working with GitHub integration ✓

Built for fun by [@petesena](https://twitter.com/petesena) ❤️