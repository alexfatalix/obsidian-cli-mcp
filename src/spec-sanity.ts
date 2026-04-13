export const REQUIRED_COMMANDS = [
  "create",
  "read",
  "search",
  "vaults",
  "version",
];

export function assertHasRequiredCommands(
  commandNames: Iterable<string>,
  context: string,
): void {
  const availableCommands = new Set(commandNames);
  const missingCommands = REQUIRED_COMMANDS.filter(
    (command) => !availableCommands.has(command),
  );

  if (missingCommands.length > 0) {
    throw new Error(
      `${context} Missing required commands: ${missingCommands.join(", ")}.`,
    );
  }
}
