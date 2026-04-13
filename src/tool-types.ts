import { z } from "zod";

export type CliOption = {
  description: string;
  flag: boolean;
  key: string;
  positional: boolean;
};

export type ToolSpec = {
  command: string;
  description: string;
  inputSchema: z.ZodTypeAny;
  name: string;
  options: CliOption[];
};

export type CommandOption = CliOption & {
  required: boolean;
  valueHint?: string;
};

export type CommandSpec = {
  command: string;
  description: string;
  options: CommandOption[];
};

export type ToolMode = "safe" | "full" | "dev";
