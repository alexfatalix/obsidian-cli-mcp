import { buildCliArgs, buildToolSpec } from "./tool-builder.js";
import { OBSIDIAN_COMMAND_SPECS } from "./generated/obsidian-spec.js";
import { assertHasRequiredCommands } from "./spec-sanity.js";
import { filterOptionsForMode, getToolMode, isCommandAllowed } from "./tool-policy.js";
import type { ToolMode, ToolSpec } from "./tool-types.js";

const toolSpecsPromises = new Map<ToolMode, Promise<ToolSpec[]>>();

assertHasRequiredCommands(
  OBSIDIAN_COMMAND_SPECS.map((commandSpec) => commandSpec.command),
  "Committed Obsidian spec is invalid.",
);

export { buildCliArgs };
export type { ToolSpec } from "./tool-types.js";

export async function getToolSpecs(): Promise<ToolSpec[]> {
  const toolMode = getToolMode();
  const existingPromise = toolSpecsPromises.get(toolMode);

  if (existingPromise) {
    return existingPromise;
  }

  const nextPromise = Promise.resolve(
    OBSIDIAN_COMMAND_SPECS
      .filter((commandSpec) => isCommandAllowed(commandSpec.command, toolMode))
      .map((commandSpec) => ({
        ...commandSpec,
        options: filterOptionsForMode(commandSpec.command, commandSpec.options, toolMode),
      }))
      .map(buildToolSpec),
  ).then((toolSpecs) => {
    assertHasRequiredCommands(
      toolSpecs.map((toolSpec) => toolSpec.command),
      `Tool policy "${toolMode}" produced an invalid tool set.`,
    );

    return toolSpecs;
  });

  toolSpecsPromises.set(toolMode, nextPromise);

  return nextPromise;
}
