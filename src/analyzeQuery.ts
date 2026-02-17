import { Client, ClientBase } from "pg";
import { Describer } from "./describe";
import assert from "assert";

export interface AnalyzeResult {
  parameters: { type_oid: number }[];
  fields: {
    type_oid: number;
    name: string;
    column?: {
      schemaName: string;
      tableName: string;
      columnName: string;
      nullable: boolean;
    };
  }[];
}

export const analyzeQuery = async (
  client: ClientBase,
  query: string,
): Promise<AnalyzeResult | null> => {
  const describer = new Describer(query);
  client.query(describer);
  const desc = await describer.promise;

  if (desc === null) return null;

  const tableOids = desc.fields.map((f) => f.tableID).filter((f) => f !== 0);

  const t_names = await client.query<{
    table_oid: number;
    table_name: string;
    table_schema: string;
  }>(
    "select oid table_oid, relname table_name, relnamespace::regnamespace::text table_schema from pg_class where oid = any($1)",
    [tableOids],
  );

  const col_names = await client.query<{
    table_oid: number;
    column_name: string;
    column_number: number;
  }>(
    "select attrelid table_oid,attname column_name, attnum column_number from pg_attribute where attrelid = any($1)",
    [tableOids],
  );

  const col_constraints = await client.query<{
    table_oid: number;
    contype: string;
    column_ids: number[];
  }>(
    "select conrelid table_oid ,contype, conkey column_ids from pg_catalog.pg_constraint where conrelid = any($1)",
    [tableOids],
  );

  return {
    parameters: desc.parameterOids.map((oid) => ({ type_oid: oid })),
    fields: desc.fields.map((f) => {
      const base: AnalyzeResult["fields"][number] = {
        type_oid: f.dataTypeID,
        name: f.name,
      };
      if (f.tableID === 0) return base;

      const t_name = t_names.rows.find((r) => r.table_oid === f.tableID);
      const col_name = col_names.rows.find(
        (r) => r.table_oid === f.tableID && r.column_number === f.columnID,
      );
      const col_constraint = col_constraints.rows.find(
        (r) =>
          r.table_oid === f.tableID &&
          r.column_ids.some((c) => c === f.columnID) &&
          ["n", "p"].includes(r.contype),
      );
      assert(t_name);
      assert(col_name);
      return {
        ...base,
        column: {
          schemaName: t_name.table_schema,
          tableName: t_name.table_name,
          columnName: col_name.column_name,
          nullable: col_constraint === undefined,
        },
      };
    }),
  };
};
