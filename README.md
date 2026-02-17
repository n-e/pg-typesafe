# pg-typesafe

pg-typesafe generates TypeScript types for PostgreSQL queries.

**Without pg-typesafe:**

```ts
const { rows } = client.query(
  "select id, name, last_modified from tbl where id = $1",
);
```

This isn't great:

- `rows` has the type `any[]`
- the argument for `$1` is missing and there are no compile-time errors

You can manually type the query:

```ts
const { rows } = client.query<
  {
    id: string;
    name: string;
    last_modified: Date;
  },
  [id: string]
>("select id, name, last_modified from tbl where id = $1", ["abc"]);
```

However:

- It's very verbose
- It's easy to make mistakes, especially:
  - Getting the nullability of the field wrong
  - Getting the deserialization type wrong. For example, with node-pg 8.x, by default, an INTEGER is deserialized into a number, but a BIGINT is kept as a string

**With pg-typesafe:**

```ts
const { rows } = client.query(
  "select id, name, last_modified from tbl where id = $1",
  ["abc"],
);
```

This is the same as the first example, however :

- `rows` is correcly typed
- the parameters array are correclty typed

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

I use pg-typesafe successfully in my projects, however some useful features are missing and coming soon:

- watch mode
- configuring type generation
- typing queries that are in SQL files
- ignoring files and silencing notice messages

## Command-Line Options

#### `--connectionString` (default: undefined)

The connection string to the postgresql database. pg-typesafe also honors
the node-pg environment variables (PGHOST, PGDATABASE...)

#### `--definitionsFile` (default: `src/defs.gen.ts`)

The path to the type definitions

#### `--tsConfigFile` (default: `tsconfig.json`)

The tsconfig file for the project. pg-typesafe uses this file to find the
files to analyze

## Type propagation

For the types to work properly, the pg-typesafe enhanced types must be used. This usually works automatically, even if you use `pool.connect` to acquire clients.

If you pass connections to functions, you may use the types such as `TypesafePoolClient`, `TypesafeQuerier`, or `TypesafeQueryFn` for example:

```ts
async function fetchFoos(client: TypesafeQuerier) {
  const { rows } = await client.query("select id, name from foo");
  return rows;
}
```

## Runtime dependencies

There are no runtime dependencies, everything is included in `defs.gen.ts`.

## Alternatives

- [pgtyped](https://pgtyped.dev): pgtyped also generates types for queries, and supports queries in both .ts and .sql files. For queries in .ts files, it is more verbose and exposes its own helpers, while pg-typesafe adds no verbosity on top of `pg`

- [kysely](https://kysely.dev): a type-safe query builder that is close to SQL
