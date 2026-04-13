import { z } from "zod";
import type { CommandOption, CommandSpec, ToolSpec } from "./tool-types.js";

const NUMERIC_HINT_PATTERN = /^<n(?:umber)?>$/i;
const LITERAL_VALUE_PATTERN = /^[A-Za-z0-9._-]+$/;
const jsonLikeSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.any()),
  z.record(z.string(), z.any()),
]);

function normalizeToolName(command: string): string {
  return command.replace(/:/g, ".");
}

function serializeCliValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number") {
    return String(value);
  }

  return JSON.stringify(value);
}

function parseLiteralValues(valueHint: string | undefined): string[] | undefined {
  if (!valueHint) {
    return undefined;
  }

  const normalizedValueHint = valueHint.replace(/^"+|"+$/g, "");

  if (normalizedValueHint.includes("<") || normalizedValueHint.includes(">")) {
    return undefined;
  }

  const values = normalizedValueHint.split("|");

  if (!values.every((value) => LITERAL_VALUE_PATTERN.test(value))) {
    return undefined;
  }

  return values;
}

function buildValueSchema(option: CommandOption): z.ZodTypeAny {
  if (option.flag) {
    return z.boolean();
  }

  const normalizedValueHint = option.valueHint?.replace(/^"+|"+$/g, "");

  if (
    normalizedValueHint === "<json>" ||
    /(?:^|\W)json(?:$|\W)/i.test(option.description)
  ) {
    return jsonLikeSchema;
  }

  if (normalizedValueHint && NUMERIC_HINT_PATTERN.test(normalizedValueHint)) {
    return z.number().int();
  }

  const literalValues = parseLiteralValues(option.valueHint);

  if (literalValues && literalValues.length > 1) {
    return z.enum(literalValues as [string, ...string[]]);
  }

  if (literalValues && literalValues.length === 1) {
    return z.literal(literalValues[0]);
  }

  return z.string();
}

function buildInputSchema(options: CommandOption[]): z.ZodTypeAny {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const option of options) {
    const valueSchema = buildValueSchema(option);
    const propertySchema = option.required ? valueSchema : valueSchema.optional();
    shape[option.key] = propertySchema.describe(option.description);
  }

  return z.object(shape).strict();
}

function buildToolDescription(command: string, description: string): string {
  return `${description} CLI command: obsidian ${command}`;
}

export function buildToolSpec(commandSpec: CommandSpec): ToolSpec {
  return {
    command: commandSpec.command,
    description: buildToolDescription(
      commandSpec.command,
      commandSpec.description,
    ),
    inputSchema: buildInputSchema(commandSpec.options),
    name: normalizeToolName(commandSpec.command),
    options: commandSpec.options.map(
      ({ description, flag, key, positional }) => ({
        description,
        flag,
        key,
        positional,
      }),
    ),
  };
}

export function buildCliArgs(
  spec: ToolSpec,
  input: Record<string, unknown>,
): string[] {
  const resolvedVault =
    typeof input.vault === "string" && input.vault.length > 0
      ? input.vault
      : process.env.OBSIDIAN_VAULT;
  const args: string[] = [];

  if (resolvedVault) {
    args.push(`vault=${serializeCliValue(resolvedVault)}`);
  }

  args.push(spec.command);

  for (const option of spec.options) {
    if (option.key === "vault") {
      continue;
    }

    const value = input[option.key];

    if (value === undefined) {
      continue;
    }

    if (option.flag) {
      if (value === true) {
        args.push(option.key);
      }

      continue;
    }

    if (option.positional) {
      args.push(serializeCliValue(value));
      continue;
    }

    args.push(`${option.key}=${serializeCliValue(value)}`);
  }

  return args;
}
