import { reservedKeywords } from "./reserved-keywords.ts";

export const wrapQuotes = (string: string) => {
  const isCamelCase = string.match(/[A-Z]/);
  const isReserved = reservedKeywords.has(string);
  const shouldWrap = isReserved || isCamelCase;

  return shouldWrap ? `"${string}"` : string;
};

export const toSnakeCase = (string: string) =>
  string
    .replace(/\W+/g, " ")
    .split(/ |\B(?=[A-Z])/)
    .map((word) => word.toLowerCase())
    .join("_");
