import { State, Token, createQueryState } from "./token.ts";

export class CollectionToken extends Token {
  tokens: Token[];

  constructor(tokens: Token[]) {
    super();

    this.tokens = tokens;
  }

  reduce(state: State, numberOfParameters: number) {
    const tokensState = createQueryState(this.tokens, numberOfParameters);
    state.parameters.push(...tokensState.parameters);
    state.text.push(...tokensState.text);
    return state;
  }
}
