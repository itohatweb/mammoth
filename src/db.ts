import * as sqlFunctions from "./sql_functions.ts";

import { Column, ColumnDefinition, ColumnDefinitionFormat } from "./column.ts";
import { makeInsertInto } from "./insert.ts";
import { makeSelect } from "./select.ts";
import { TableDefinition, makeTable } from "./table.ts";

import { CaseStatement } from "./case.ts";
import { QueryExecutorFn } from "./types.ts";
import { Table } from "./table_type.ts";
import { makeDeleteFrom } from "./delete.ts";
import { makeTruncate } from "./truncate.ts";
import { makeUpdate } from "./update.ts";
import { makeWith } from "./with.ts";
import { wrapQuotes } from "./naming/mod.ts";

const createTables = <TableDefinitions extends { [key: string]: TableDefinition<any> }>(
  tableDefinitions: TableDefinitions
): {
  [TableName in keyof TableDefinitions]: TableDefinitions[TableName] extends TableDefinition<infer ColumnDefinitions>
    ? Table<
        TableName,
        {
          [K in keyof ColumnDefinitions]: K extends string
            ? Column<
                K,
                TableName,
                ColumnDefinitions[K] extends ColumnDefinition<infer DataType, any, any> ? DataType : never,
                ColumnDefinitions[K] extends ColumnDefinition<any, infer IsNotNull, any> ? IsNotNull : never,
                ColumnDefinitions[K] extends ColumnDefinition<any, any, infer HasDefault> ? HasDefault : never,
                undefined
              >
            : never;
        }
      >
    : never;
} => {
  return Object.keys(tableDefinitions).reduce((tables, key) => {
    const tableDefinition = tableDefinitions[key];

    tables[key] = makeTable(key, undefined, tableDefinition as any);

    return tables;
  }, {} as any);
};

export const defineDb = <TableDefinitions extends { [key: string]: TableDefinition<any> }>(
  tableDefinitions: TableDefinitions,
  queryExecutor: QueryExecutorFn
) => {
  return {
    /** @internal */
    getTableDefinitions(): {
      name: string;
      originalDefinition: any;
      columns: (ColumnDefinitionFormat & { name: string })[];
    }[] {
      const tableNames = Object.keys(tableDefinitions);

      return tableNames.map((tableName) => {
        const table = tableDefinitions[tableName];
        const columnNames = Object.keys(table);

        return {
          name: tableName,
          columns: columnNames.map((columnName) => ({
            name: columnName,
            ...(table as any)[columnName].getDefinition(),
          })),
          originalDefinition: table,
        };
      });
    },
    async createTables(tableName?: keyof typeof tableDefinitions) {
      for (const definition of tableName
        ? [this.getTableDefinitions().find((table) => table.name === tableName)!]
        : this.getTableDefinitions()) {
        const queryParts = [];
        queryParts.push(`CREATE TABLE IF NOT EXISTS ${wrapQuotes(definition.name)}`);

        const columnParts: string[] = [];

        for (const { name, dataType, isNotNull, isPrimaryKey, isUnique, defaultExpression } of definition.columns) {
          const column: string[] = [];
          column.push(wrapQuotes(name), dataType);
          if (isNotNull) column.push("NOT NULL");
          if (isPrimaryKey) column.push("PRIMARY KEY");
          if (isUnique) column.push("UNIQUE");
          if (defaultExpression !== undefined) {
            column.push(`DEFAULT ${defaultExpression}`);
          }
          columnParts.push(column.join(" "));
        }

        queryParts.push(`( ${columnParts.join(", ")} );`);

        await queryExecutor(queryParts.join(" "), []);
      }
    },
    select: makeSelect(queryExecutor),
    insertInto: makeInsertInto(queryExecutor),
    deleteFrom: makeDeleteFrom(queryExecutor),
    update: makeUpdate(queryExecutor),
    with: makeWith(queryExecutor),
    truncate: makeTruncate(queryExecutor),
    case: () => new CaseStatement<never>([]),
    ...sqlFunctions,

    ...createTables(tableDefinitions),
  };
};
