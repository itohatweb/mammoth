import { Token } from "./token.ts";

export class EmptyToken extends Token {
  // deno-lint-ignore no-explicit-any
  reduce(state: any) {
    return state;
  }
}
