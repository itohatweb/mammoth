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
        const primaryKeys: string[] = [];

        // const alterQueries: string[] = [];

        for (const {
          name,
          dataType,
          isNotNull,
          isPrimaryKey,
          isUnique,
          defaultExpression,
          enumValues,
        } of definition.columns) {
          const meta: string[] = [];
          if (isNotNull) meta.push("NOT NULL");
          // if (isPrimaryKey) meta.push("PRIMARY KEY");
          if (isPrimaryKey) primaryKeys.push(wrapQuotes(name));
          if (isUnique) meta.push("UNIQUE");
          if (defaultExpression !== undefined) {
            meta.push(`DEFAULT ${defaultExpression}`);
          }

          columnParts.push(meta.join(" "));

          // alterQueries.push(`
          // DO
          // $do$
          // BEGIN
          //   IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${
          //     definition.name
          //   }' AND column_name='${name}') THEN
          //     SELECT * FROM ${wrapQuotes(definition.name)};
          //   ELSE
          //     ALTER TABLE ${wrapQuotes(definition.name)} ADD ${wrapQuotes(name)} ${dataType} ${meta.join(" ")}
          //   END IF;
          // END
          // $do$;
          // `);

          // CREATE ENUM TYPE IF IT EXISTS
          if (enumValues !== undefined) {
            // RENAME THE EXISTING ENUM SO THE NAME OF THE NEW ENUM DOES NOT CONFLICT WITH
            let enumQuery = `
            DO
            $do$
            BEGIN
               IF EXISTS (SELECT 1 FROM pg_type WHERE typname = '${dataType}') THEN
                   ALTER TYPE ${wrapQuotes(dataType)} RENAME TO "${dataType}_old";
               END IF;
            END
            $do$;
            `;

            // CREATE THE NEW ENUM
            enumQuery += `CREATE TYPE "${dataType}" AS ENUM(${enumValues.map((value) => `'${value}'`)});`;

            // ALTER THE TABLE IF IT EXIST TO USE THE NEW ENUM
            enumQuery += `ALTER TABLE IF EXISTS ${wrapQuotes(definition.name)} ALTER COLUMN ${wrapQuotes(
              name
            )} TYPE ${wrapQuotes(dataType)} USING ${wrapQuotes(name)}::text::${dataType};`;

            // DELETE THE OLD ENUM
            enumQuery += `DROP TYPE IF EXISTS "${dataType}_old";`;

            await queryExecutor(enumQuery, []);
          }
        }

        columnParts.push(`PRIMARY KEY (${primaryKeys.join(", ")})`);

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
