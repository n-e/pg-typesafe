# pg-typesafe

pg-typesafe generates TypeScript types for PostgreSQL queries.

pg-typesafe does so with no runtime dependencies, and zero additional verbosity.

Here is a query with `pg-typesafe`:

```ts
const { rows } = client.query(
  "select id, name, last_modified from tbl where id = $1",
  [42],
);
```

This query looks the same as a normal query with `pg`, but is fully typed:

- The parameter is required, and must be a number
- `rows` has the type `{ id:number; name:string; last_modified: Date }[]`

## Getting Started

Install pg-typesafe:

```sh
npm i -D pg-typesafe
```

Run it for the first time:

```sh
npm exec pg-typesafe -- --connectionString postgres://postgres:example@localhost
```

This will generate the file `src/defs.gen.ts` that contains the pg-typesafe types.

Now that the types are generated you can cast your `Pool` to the pg-typesafe type:

```ts
import type { TypesafePool } from "./defs.gen.ts";

export const pool = new Pool() as TypesafePool;
```

This will allow pg-typesafe to find you queries, and also type them properly.

You can now run pg-typesafe again to generate the types:

```sh
npm exec pg-typesafe -- --connectionString postgres://postgres:example@localhost
```

## Limitations

pg-typesafe can only type queries where the SQL query is a constant, as dynamic queries cannot be analyzed. You should however, when possible, do so, as it avoids SQL injections and is faster.

## Command-Line Options

#### `--connectionString` (default: undefined)

The connection string to the postgresql database. pg-typesafe also honors
the node-pg environment variables (PGHOST, PGDATABASE...)

#### `--definitionsFile` (default: `src/defs.gen.ts`)

The path to the type definitions

#### `--tsConfigFile` (default: `tsconfig.json`)

The tsconfig file for the project. pg-typesafe uses this file to find the
files to analyze

#### `--configFile` (default: `pg-typesafe.config.ts`)

The pg-typesasfe configuration file

## Configuration file

Basic `pg-typesafe.config.ts`:

```ts
import { defineConfig } from "pg-typesafe";

export default defineConfig({
  connectionString: "postgres://postgres:example@localhost",
});
```

The full list of parameters is available as JSDoc.

## Recipes

### Convert BIGINTs to JavaScript bigints

By default, `pg` returns BIGINTs as strings, as very large values cannot be represented exactly by the JavaScript number type.

In "newer" node.js versions, the bigint type is supported, let's use it.

On the `pg` side, do the conversion:

```ts
import { types } from "pg";
types.setTypeParser(20, (val) => BigInt(val));
```

On the pg-typesafe side, generate the right types:

```ts
export default defineConfig({
  // when a query accepts a BIGINT as a parameter, type it as bigint
  transformParameter(param) {
    if (param.type_oid === 20) {
      return { type: "bigint" };
    }
    return defaultTransformParameter(param);
  },
  // when a query returns a BIGINT, type it as bigint
  transformField(field) {
    if (field.type_oid === 20) {
      return { type: "bigint" };
    }
    return defaultTransformField(field);
  },
});
```

### Type JSONB columns to the right type depending on the context

If your JSONB columns contain that data that conform to a schema, it can be nice to type them to the "right" type.

To do this, we will type the columns as `table_name_column_name`, then define these types in another file.

```ts
export default defineConfig({
  transformField(field) {
    if (field.type_oid === 3802 && field.column) {
      const c = field.column;
      const typeName = c.table_name + "_" + c.column_name;
      return {
        type: typeName,
        imports: [{ name: typeName, path: "./jsonb_columns.ts" }],
      };
    }
    return defaultTransformField(field);
  },
});
```

Then, if you have a table `hello` with a JSONB column `data`, you can create a `jsonb_columns.ts` file with the right type:

```ts
export interface hello_data {
  foo: string;
  bar: number;
}
```

## Type propagation

For the types to work properly, the pg-typesafe enhanced types must be used. This usually works automatically, even if you use `pool.connect` to acquire clients.

If you pass connections to functions, you may use the types such as `TypesafePoolClient`, `TypesafeQuerier`, or `TypesafeQueryFn` for example:

```ts
async function fetchFoos(client: TypesafeQuerier) {
  const { rows } = await client.query("select id, name from foo");
  return rows;
}
```

## Alternatives

- [pgtyped](https://pgtyped.dev): pgtyped also generates types for queries, and supports queries in both .ts and .sql files. For queries in .ts files, it is more verbose and exposes its own helpers, while pg-typesafe adds no verbosity on top of `pg`

- [kysely](https://kysely.dev): a type-safe query builder that is close to SQL
