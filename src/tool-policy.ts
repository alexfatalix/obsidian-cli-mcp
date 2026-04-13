import type { CommandOption, ToolMode } from "./tool-types.js";

const DEFAULT_TOOL_MODE: ToolMode = "safe";
const SAFE_COMMANDS = new Set<string>([
  "aliases",
  "append",
  "backlinks",
  "base:query",
  "base:views",
  "bases",
  "create",
  "daily:append",
  "daily:path",
  "daily:prepend",
  "daily:read",
  "deadends",
  "file",
  "files",
  "folder",
  "folders",
  "hotkey",
  "hotkeys",
  "links",
  "orphans",
  "outline",
  "prepend",
  "properties",
  "property:read",
  "random:read",
  "read",
  "recents",
  "search",
  "search:context",
  "tag",
  "tags",
  "tasks",
  "template:read",
  "unresolved",
  "vault",
  "vaults",
  "version",
  "wordcount",
  "workspace",
  "workspaces",
]);
const SAFE_OPTION_DENYLIST = new Map<string, Set<string>>([
  ["create", new Set(["overwrite", "open", "newtab"])],
  ["daily:append", new Set(["open", "paneType"])],
  ["daily:prepend", new Set(["open", "paneType"])],
]);

function isDeveloperCommand(command: string): boolean {
  return command === "devtools" || command === "eval" || command.startsWith("dev:");
}

export function getToolMode(): ToolMode {
  const value = process.env.OBSIDIAN_TOOL_MODE?.trim().toLowerCase();

  if (value === "safe" || value === "full" || value === "dev") {
    return value;
  }

  return DEFAULT_TOOL_MODE;
}

export function isCommandAllowed(command: string, toolMode: ToolMode): boolean {
  if (toolMode === "dev") {
    return true;
  }

  if (isDeveloperCommand(command)) {
    return false;
  }

  if (toolMode === "full") {
    return true;
  }

  return SAFE_COMMANDS.has(command);
}

export function filterOptionsForMode(
  command: string,
  options: CommandOption[],
  toolMode: ToolMode,
): CommandOption[] {
  if (toolMode !== "safe") {
    return options;
  }

  const deniedOptions = SAFE_OPTION_DENYLIST.get(command);

  if (!deniedOptions) {
    return options;
  }

  return options.filter((option) => !deniedOptions.has(option.key));
}
