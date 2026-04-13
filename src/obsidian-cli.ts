import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const DEFAULT_CLI_TIMEOUT_MS = 30_000;
const DEFAULT_CLI_MAX_BUFFER_BYTES = 16 * 1024 * 1024;

const OBSIDIAN_CLI_CANDIDATES = [
  process.env.OBSIDIAN_CLI,
  "obsidian",
  "/Applications/Obsidian.app/Contents/MacOS/obsidian-cli",
].filter((value): value is string => Boolean(value));

export type CommandResult = {
  stdout: string;
  stderr: string;
};

let obsidianCliPathPromise: Promise<string> | undefined;
const REDACTED_ARGUMENT_KEYS = new Set([
  "code",
  "content",
  "params",
  "value",
]);

function parsePositiveIntegerEnv(
  rawValue: string | undefined,
  fallback: number,
): number {
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getExecFileOptions() {
  return {
    maxBuffer: parsePositiveIntegerEnv(
      process.env.OBSIDIAN_CLI_MAX_BUFFER_BYTES,
      DEFAULT_CLI_MAX_BUFFER_BYTES,
    ),
    timeout: parsePositiveIntegerEnv(
      process.env.OBSIDIAN_CLI_TIMEOUT_MS,
      DEFAULT_CLI_TIMEOUT_MS,
    ),
  };
}

function redactArgument(arg: string): string {
  const separatorIndex = arg.indexOf("=");

  if (separatorIndex === -1) {
    return arg;
  }

  const key = arg.slice(0, separatorIndex);

  if (!REDACTED_ARGUMENT_KEYS.has(key)) {
    return arg;
  }

  return `${key}=[REDACTED]`;
}

function formatCommandError(
  executable: string,
  args: string[],
  error: unknown,
): Error {
  const execError = error as Error & NodeJS.ErrnoException & {
    killed?: boolean;
    signal?: NodeJS.Signals | null;
    stdout?: string;
    stderr?: string;
  };
  const details = [
    `Command failed: ${executable} ${args.map(redactArgument).join(" ")}`.trim(),
  ];

  if (execError.code === "ETIMEDOUT" || execError.signal === "SIGTERM") {
    details.push("Command timed out.");
  }

  if (
    typeof execError.message === "string" &&
    execError.message.toLowerCase().includes("maxbuffer")
  ) {
    details.push("Command output exceeded maxBuffer.");
  }

  return new Error(
    [
      ...details,
      execError.message,
      `stdout: ${execError.stdout ?? ""}`,
      `stderr: ${execError.stderr ?? ""}`,
    ].join("\n"),
  );
}

async function getObsidianCliPath(): Promise<string> {
  if (!obsidianCliPathPromise) {
    obsidianCliPathPromise = (async () => {
      let lastError: Error | undefined;

      for (const candidate of OBSIDIAN_CLI_CANDIDATES) {
        try {
          await execFileAsync(candidate, ["--help"], getExecFileOptions());
          return candidate;
        } catch (error) {
          const execError = error as NodeJS.ErrnoException;

          if (execError.code === "ENOENT") {
            lastError = execError;
            continue;
          }

          throw formatCommandError(candidate, ["--help"], error);
        }
      }

      throw (
        lastError ??
        new Error(
          "Unable to locate Obsidian CLI. Set OBSIDIAN_CLI or add obsidian to PATH.",
        )
      );
    })();
  }

  return obsidianCliPathPromise;
}

export async function runObsidian(args: string[]): Promise<CommandResult> {
  const executable = await getObsidianCliPath();

  try {
    const { stdout, stderr } = await execFileAsync(
      executable,
      args,
      getExecFileOptions(),
    );
    return { stdout, stderr };
  } catch (error) {
    throw formatCommandError(executable, args, error);
  }
}
