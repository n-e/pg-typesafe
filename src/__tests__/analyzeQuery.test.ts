import { expect, it } from "vitest";
import { analyzeQuery } from "../analyzeQuery";
import { pool } from "./pg";

it("analyzes a table-less query", async () => {
  const conn = await pool.connect();
  const r = await analyzeQuery(conn, "select 1");
  expect(r).toMatchInlineSnapshot(`
    {
      "fields": [
        {
          "name": "?column?",
          "type_oid": 23,
        },
      ],
      "parameters": [],
    }
  `);

  conn.release();
});

it("analyzes a table-full query", async () => {
  const conn = await pool.connect();
  const r = await analyzeQuery(
    conn,
    "select oid,typname from pg_catalog.pg_type where oid = $1",
  );
  expect(r).toMatchInlineSnapshot(`
    {
      "fields": [
        {
          "column": {
            "columnName": "oid",
            "nullable": false,
            "schemaName": "pg_catalog",
            "tableName": "pg_type",
          },
          "name": "oid",
          "type_oid": 26,
        },
        {
          "column": {
            "columnName": "typname",
            "nullable": true,
            "schemaName": "pg_catalog",
            "tableName": "pg_type",
          },
          "name": "typname",
          "type_oid": 19,
        },
      ],
      "parameters": [
        {
          "type_oid": 26,
        },
      ],
    }
  `);

  conn.release();
});
