import type { CommandOption, CommandSpec } from "./tool-types.js";

const SECTION_OPTIONS = "Options:";
const SECTION_NOTES = "Notes:";
const SECTION_COMMANDS = "Commands:";
const SECTION_DEVELOPER = "Developer:";
const COMMAND_LINE_PATTERN = /^  (\S+)\s{2,}(.+)$/;
const OPTION_LINE_PATTERN = /^ {4}(.+?)\s{2,}-\s+(.+)$/;
const POSITIONAL_VALUE_PATTERN = /^<(.+)>$/;
const QUOTED_POSITIONAL_VALUE_PATTERN = /^"<(.+)>"$/;

function normalizeInputKey(rawKey: string): string {
  const normalized = rawKey
    .replace(/[^A-Za-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized || "value";
}

function extractPositionalKey(token: string): string | undefined {
  const positionalMatch =
    token.match(POSITIONAL_VALUE_PATTERN) ??
    token.match(QUOTED_POSITIONAL_VALUE_PATTERN);

  if (!positionalMatch) {
    return undefined;
  }

  return normalizeInputKey(positionalMatch[1]);
}

function parseOption(token: string, description: string): CommandOption {
  const positionalKey = extractPositionalKey(token);

  if (positionalKey) {
    return {
      description,
      flag: false,
      key: positionalKey,
      positional: true,
      required: /\(required\)/i.test(description),
      valueHint: token,
    };
  }

  if (!token.includes("=")) {
    return {
      description,
      flag: true,
      key: token,
      positional: false,
      required: false,
    };
  }

  const separatorIndex = token.indexOf("=");

  return {
    description,
    flag: false,
    key: token.slice(0, separatorIndex),
    positional: false,
    required: /\(required\)/i.test(description),
    valueHint: token.slice(separatorIndex + 1),
  };
}

export function parseHelpOutput(helpText: string): CommandSpec[] {
  const lines = helpText.split(/\r?\n/);
  const globalOptions: CommandOption[] = [];
  const commands: CommandSpec[] = [];
  let currentCommand: CommandSpec | undefined;
  let section: "idle" | "options" | "notes" | "commands" | "developer" = "idle";

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed === SECTION_OPTIONS) {
      section = "options";
      currentCommand = undefined;
      continue;
    }

    if (trimmed === SECTION_NOTES) {
      section = "notes";
      currentCommand = undefined;
      continue;
    }

    if (trimmed === SECTION_COMMANDS) {
      section = "commands";
      currentCommand = undefined;
      continue;
    }

    if (trimmed === SECTION_DEVELOPER) {
      section = "developer";
      currentCommand = undefined;
      continue;
    }

    if (section === "options") {
      const optionMatch = line.match(COMMAND_LINE_PATTERN);

      if (optionMatch) {
        globalOptions.push(parseOption(optionMatch[1], optionMatch[2]));
      }

      continue;
    }

    if (section !== "commands" && section !== "developer") {
      continue;
    }

    const commandMatch = line.match(COMMAND_LINE_PATTERN);

    if (commandMatch) {
      currentCommand = {
        command: commandMatch[1],
        description: commandMatch[2],
        options: [...globalOptions],
      };
      commands.push(currentCommand);
      continue;
    }

    if (!currentCommand) {
      continue;
    }

    const optionMatch = line.match(OPTION_LINE_PATTERN);

    if (optionMatch) {
      currentCommand.options.push(parseOption(optionMatch[1], optionMatch[2]));
    }
  }

  return commands;
}
