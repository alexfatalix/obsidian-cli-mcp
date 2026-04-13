# Obsidian CLI MCP

Local MCP server for Obsidian CLI.

This project connects MCP clients to your local Obsidian vault through the official Obsidian CLI.

It runs over `stdio` and is intended for personal local use with MCP clients such as Claude Code, Codex, MCP Inspector, and other compatible tools.

It does not require third-party Obsidian plugins, community extensions, or custom vault integrations. It uses the Obsidian desktop app and the built-in Obsidian CLI only.

## Requirements

- Obsidian desktop app installed
- Obsidian CLI enabled and available as `obsidian`
- Node.js 18+

To enable Obsidian CLI in the desktop app:

- `Settings -> General -> Advanced -> Command line interface`

## Run with npx

```bash
npx -y @alexfatalix/obsidian-cli-mcp
```

## MCP Config

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "npx",
      "args": ["-y", "@alexfatalix/obsidian-cli-mcp"],
      "env": {
        "OBSIDIAN_VAULT": "My Vault",
        "OBSIDIAN_TOOL_MODE": "safe"
      }
    }
  }
}
```

## What It Does

- Exposes Obsidian CLI commands as MCP tools
- Lets MCP clients read, search, create, and update notes in your vault
- Uses local `stdio` transport instead of opening a network server
- Works with your local Obsidian setup and your own vault

## Configuration

- `OBSIDIAN_VAULT`: default vault used for tool calls
- `OBSIDIAN_TOOL_MODE`: tool policy mode
  - `safe` — note-focused subset, default
  - `full` — all non-developer Obsidian CLI tools
  - `dev` — full CLI, including developer tools
- `OBSIDIAN_CLI`: custom path to the Obsidian CLI binary
- `OBSIDIAN_CLI_TIMEOUT_MS`: per-command timeout, default `30000`
- `OBSIDIAN_CLI_MAX_BUFFER_BYTES`: max captured stdout/stderr size, default `16777216`

## Notes

- Tool names match Obsidian CLI command names
- `:` in command names is exposed as `.`
- Example: `daily:append` becomes `daily.append`
- `safe` mode is recommended for normal use
- No third-party Obsidian plugins are required

## License

MIT. See [LICENSE](./LICENSE).
