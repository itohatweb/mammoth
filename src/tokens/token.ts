export abstract class Token {
  abstract reduce(state: any, numberOfParameters: number): any;
}

export interface State {
  text: string[];
  parameters: any[];
}

export const createQueryState = (
  tokens: Token[],
  currentParameterIndex: number = 0,
  initialState = {
    text: [],
    parameters: [],
  }
): State => {
  return tokens.reduce((tokenState, token) => {
    if (Array.isArray(token)) {
      return createQueryState(token, tokenState.parameters.length + currentParameterIndex, tokenState);
    }

    return token.reduce(tokenState, tokenState.parameters.length + currentParameterIndex);
  }, initialState);
};
