import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { OBSIDIAN_COMMAND_SPECS } from "../dist/generated/obsidian-spec.js";
import { parseHelpOutput } from "../dist/help-parser.js";
import { runObsidian } from "../dist/obsidian-cli.js";
import { renderGeneratedSpec } from "../dist/spec-generator.js";
import { REQUIRED_COMMANDS } from "../dist/spec-sanity.js";
import { getToolSpecs } from "../dist/tool-specs.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const committedSpecPath = resolve(__dirname, "../src/generated/obsidian-spec.ts");

function getCommandSpec(commandSpecs, command) {
  const commandSpec = commandSpecs.find((entry) => entry.command === command);
  assert.ok(commandSpec, `Missing command spec: ${command}`);
  return commandSpec;
}

function assertCommandHasOption(commandSpecs, command, optionKey) {
  const commandSpec = getCommandSpec(commandSpecs, command);
  assert.ok(
    commandSpec.options.some((option) => option.key === optionKey),
    `Missing option "${optionKey}" for command "${command}"`,
  );
}

test("committed explicit spec contains required commands", () => {
  const commandNames = new Set(
    OBSIDIAN_COMMAND_SPECS.map((commandSpec) => commandSpec.command),
  );

  assert.ok(OBSIDIAN_COMMAND_SPECS.length > 0);

  for (const command of REQUIRED_COMMANDS) {
    assert.ok(commandNames.has(command), `Missing required command: ${command}`);
  }
});

test("tool policies expose expected command sets from committed spec", async () => {
  process.env.OBSIDIAN_TOOL_MODE = "safe";
  const safeToolSpecs = await getToolSpecs();
  const safeToolNames = new Set(safeToolSpecs.map((toolSpec) => toolSpec.name));

  assert.ok(safeToolNames.has("create"));
  assert.ok(safeToolNames.has("read"));
  assert.ok(!safeToolNames.has("delete"));
  assert.ok(!safeToolNames.has("dev.cdp"));

  process.env.OBSIDIAN_TOOL_MODE = "full";
  const fullToolSpecs = await getToolSpecs();
  const fullToolNames = new Set(fullToolSpecs.map((toolSpec) => toolSpec.name));

  assert.ok(fullToolNames.has("delete"));
  assert.ok(!fullToolNames.has("dev.cdp"));

  process.env.OBSIDIAN_TOOL_MODE = "dev";
  const devToolSpecs = await getToolSpecs();
  const devToolNames = new Set(devToolSpecs.map((toolSpec) => toolSpec.name));

  assert.ok(devToolNames.has("delete"));
  assert.ok(devToolNames.has("dev.cdp"));
});

test("live Obsidian help matches committed spec and keeps representative options", async () => {
  const { stdout } = await runObsidian(["--help"]);
  const parsedCommands = parseHelpOutput(stdout);

  for (const command of REQUIRED_COMMANDS) {
    getCommandSpec(parsedCommands, command);
  }

  assertCommandHasOption(parsedCommands, "create", "name");
  assertCommandHasOption(parsedCommands, "create", "content");
  assertCommandHasOption(parsedCommands, "append", "file");
  assertCommandHasOption(parsedCommands, "append", "content");
  assertCommandHasOption(parsedCommands, "search", "query");

  assert.deepEqual(parsedCommands, OBSIDIAN_COMMAND_SPECS);

  const committedSpecSource = await readFile(committedSpecPath, "utf8");
  assert.equal(renderGeneratedSpec(parsedCommands), committedSpecSource);
});
