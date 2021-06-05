import type { Column } from "./column.ts";
import { DeleteQuery } from "./delete.ts";
import type { Expression } from "./expression.ts";
import { GetDataType } from "./types.ts";
import { InsertQuery } from "./insert.ts";
import { Query } from "./query.ts";
import { SelectQuery } from "./select.ts";
import { UpdateQuery } from "./update.ts";

// export class GetDataType<Type, IsNull> {
//   private _!: Type & IsNull;
// }

export type ResultSetDataType<Type, IsNotNull> = IsNotNull extends true ? Type : Type | undefined;

// This is not ideal, but, using dts-jest and it's snapshotting it's not capable to snapshot an e.g.
// optional number to `number | undefined`. Instead, it will snapshot to `number`. Because it's
// important to get the optional behaviour under test as well (it's so easy to create a regression)
// this flag is introduced to return a nominal class which gets snapshotted with the correct info.
export type ResultSet<T extends Query<any>, Test extends boolean> = T extends SelectQuery<infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<any, any, infer D, infer N, any, infer JoinType>
        ? Extract<JoinType, "left-join"> extends never
          ? Extract<JoinType, "left-side-of-right-join"> extends never
            ? Extract<JoinType, "full-join"> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<D, false>
        : Returning[K] extends Expression<infer D, infer IsNotNull, any>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Returning[K], Test>[keyof ResultSet<Returning[K], Test>]
        : never;
    }
  : T extends DeleteQuery<any, infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<any, any, infer D, infer N, any, infer JoinType>
        ? Extract<JoinType, "left-join"> extends never
          ? Extract<JoinType, "left-side-of-right-join"> extends never
            ? Extract<JoinType, "full-join"> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<D, false>
        : Returning[K] extends Expression<infer D, infer IsNotNull, any>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Returning[K], Test>[keyof ResultSet<Returning[K], Test>]
        : never;
    }
  : T extends UpdateQuery<any, infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<any, any, infer D, infer N, any, infer JoinType>
        ? Extract<JoinType, "left-join"> extends never
          ? Extract<JoinType, "left-side-of-right-join"> extends never
            ? Extract<JoinType, "full-join"> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<D, false>
        : Returning[K] extends Expression<infer D, infer IsNotNull, any>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Returning[K], Test>[keyof ResultSet<Returning[K], Test>]
        : never;
    }
  : T extends InsertQuery<any, infer Returning>
  ? {
      [K in keyof Returning]: Returning[K] extends Column<any, any, infer D, infer N, any, infer JoinType>
        ? Extract<JoinType, "left-join"> extends never
          ? Extract<JoinType, "left-side-of-right-join"> extends never
            ? Extract<JoinType, "full-join"> extends never
              ? N extends true
                ? Test extends true
                  ? GetDataType<D, true>
                  : ResultSetDataType<D, true>
                : Test extends true
                ? GetDataType<D, false>
                : ResultSetDataType<D, false>
              : Test extends true
              ? GetDataType<D, false>
              : ResultSetDataType<D, false>
            : Test extends true
            ? GetDataType<D, false>
            : ResultSetDataType<D, false>
          : Test extends true
          ? GetDataType<D, false>
          : ResultSetDataType<D, false>
        : Returning[K] extends Expression<infer D, infer IsNotNull, any>
        ? Test extends true
          ? GetDataType<D, IsNotNull>
          : ResultSetDataType<D, IsNotNull>
        : Returning[K] extends Query<{}>
        ? ResultSet<Returning[K], Test>[keyof ResultSet<Returning[K], Test>]
        : never;
    }
  : never;
