import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseHelpOutput } from "../src/help-parser.js";
import { runObsidian } from "../src/obsidian-cli.js";
import { renderGeneratedSpec } from "../src/spec-generator.js";
import { assertHasRequiredCommands } from "../src/spec-sanity.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outputPath = resolve(__dirname, "../src/generated/obsidian-spec.ts");

async function main(): Promise<void> {
  const { stdout } = await runObsidian(["--help"]);
  const commandSpecs = parseHelpOutput(stdout);

  assertHasRequiredCommands(
    commandSpecs.map((commandSpec) => commandSpec.command),
    'Obsidian CLI help parsing failed.',
  );

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, renderGeneratedSpec(commandSpecs), "utf8");
  console.log(`Updated ${outputPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
