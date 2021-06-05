import { QueryExecutorFn, ResultType } from "./types.ts";
import { StringToken, Token, createQueryState } from "./tokens/mod.ts";

import { Query } from "./query.ts";
import { Table } from "./table_type.ts";
import { TableDefinition } from "./table.ts";

export const makeTruncate = (queryExecutor: QueryExecutorFn) => <T extends Table<any, any>>(
  table: T
): T extends TableDefinition<any> ? never : TruncateQuery<T> => {
  return new TruncateQuery<T>(queryExecutor, table, "AFFECTED_COUNT", [
    new StringToken(`TRUNCATE`),
    new StringToken((table as Table<any, any>).getName()),
  ]) as any;
};

export class TruncateQuery<
  T extends Table<any, any>,
  Returning = number,
  TableColumns = T extends Table<any, infer Columns> ? Columns : never
> extends Query<Returning> {
  constructor(
    private readonly queryExecutor: QueryExecutorFn,
    private readonly table: T,
    private readonly resultType: ResultType,
    private readonly tokens: Token[]
  ) {
    super();
  }

  then<Result1, Result2 = never>(
    onFulfilled?: ((value: number) => Result1 | PromiseLike<Result1>) | undefined | null,
    onRejected?: ((reason: any) => Result2 | PromiseLike<Result2>) | undefined | null
  ): Promise<Result1 | Result2> {
    const queryState = createQueryState(this.tokens);

    return this.queryExecutor(queryState.text.join(` `), queryState.parameters)
      .then((result) => onFulfilled?.(result.affectedCount))
      .catch(onRejected) as any;
  }

  restartIdentity<T extends Table<any, any>>() {
    return this.newTruncateQuery([...this.tokens, new StringToken(`RESTART IDENTITY`)]) as any;
  }

  continueIdentity<T extends Table<any, any>>() {
    return this.newTruncateQuery([...this.tokens, new StringToken(`CONTINUE IDENTITY`)]) as any;
  }

  cascade<T extends Table<any, any>>() {
    return this.newTruncateQuery([...this.tokens, new StringToken("CASCADE")]);
  }

  restrict<T extends Table<any, any>>() {
    return this.newTruncateQuery([...this.tokens, new StringToken("RESTRICT")]);
  }

  private newTruncateQuery(tokens: Token[]): TruncateQuery<any> {
    return new TruncateQuery(this.queryExecutor, this.table, "AFFECTED_COUNT", tokens);
  }

  getReturningKeys(): string[] {
    return [];
  }

  toTokens(): Token[] {
    return this.tokens;
  }
}
