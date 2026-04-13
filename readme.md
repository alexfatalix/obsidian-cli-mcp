# Obsidian CLI MCP

Local MCP server for Obsidian CLI.

It runs over `stdio` and is intended for personal local use with MCP clients such as Codex, Inspector, or other compatible tools.

## Requirements

- Obsidian desktop app installed
- Obsidian CLI installed and available as `obsidian`
- Node.js 18+

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

## License

MIT. See [LICENSE](./LICENSE).
