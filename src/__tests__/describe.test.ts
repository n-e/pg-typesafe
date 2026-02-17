import { expect, it } from "vitest";
import { pool } from "./pg";
import { Describer } from "../describe";

const query = (q: string) => {
  const d = new Describer(q);
  pool.query(d);
  return d.promise;
};

it("works on a simple query", async () => {
  const r = await query("select 1");
  expect(r).toMatchInlineSnapshot(`
    {
      "fields": [
        Field {
          "columnID": 0,
          "dataTypeID": 23,
          "dataTypeModifier": -1,
          "dataTypeSize": 4,
          "format": "text",
          "name": "?column?",
          "tableID": 0,
        },
      ],
      "parameterOids": [],
    }
  `);
});

it("rejects a bad query", async () => {
  const r = query("selec-");
  await expect(r).rejects.toMatchInlineSnapshot(
    `[error: syntax error at or near "selec"]`,
  );
});

it("returns null for a query that doesn't return data", async () => {
  const r = await query("create table t (id text)");
  expect(r).toBeNull();
});

it("keeps the connection usable after having done its job", async () => {
  const conn = await pool.connect();
  const d = new Describer("select 1");
  conn.query(d);
  await d.promise;

  const r = await conn.query("select 1");
  expect(r.rows).toMatchInlineSnapshot(`
    [
      {
        "?column?": 1,
      },
    ]
  `);

  conn.release();
});

it("keeps the connection usable after an error", async () => {
  const conn = await pool.connect();
  const d = new Describer("sel-");
  conn.query(d);
  await expect(d.promise).rejects.toThrow();

  const r = await conn.query("select 1");
  expect(r.rows).toMatchInlineSnapshot(`
    [
      {
        "?column?": 1,
      },
    ]
  `);

  conn.release();
});

it.only("works on a query that takes arguments but returns nothing", async () => {
  const conn = await pool.connect();
  await conn.query("create temporary table t(f text)");

  const d = new Describer("insert into t(f) values($1)");
  conn.query(d);
  const desc = await d.promise;

  expect(desc).toMatchInlineSnapshot(`
    {
      "fields": [],
      "parameterOids": [
        25,
      ],
    }
  `);

  conn.release();
});
