#!/usr/bin/env node

import assert from "node:assert";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { argv } from "node:process";
import { inspect, parseArgs } from "node:util";
import { Client } from "pg";
import { Project, SyntaxKind } from "ts-morph";
import { analyzeQuery } from "./analyzeQuery.ts";
import {
  defaultTransformField,
  defaultTransformParameter,
} from "./typeTransform.ts";

const head = `import { type Pool, type PoolClient, type Client, type QueryResultBase } from "pg";

export type TypesafeQueryFn = <T extends keyof Queries>(
  query: T,
  ...args: Queries[T]["parameters"] extends unknown[]
    ? unknown[]
    : Queries[T]["parameters"] extends []
      ? []
      : [values: Queries[T]["parameters"]]
) => Promise<QueryResultBase & { rows: Queries[T]["fields"][] }>;

export type TypesafePoolClient = Omit<PoolClient, 'query'> & { query: TypesafeQueryFn; }
export type TypesafeClient = Omit<Client, 'query'> & { query: TypesafeQueryFn; }
export type TypesafePool = Omit<Pool, 'query' | 'connect'> & { query: TypesafeQueryFn; connect(): Promise<TypesafePoolClient>; }
export type TypesafeQuerier = { query: TypesafeQueryFn; }
`;

const buildQueryObj = (
  data?: Map<
    string,
    { parameters: string[]; fields: { k: string; v: string }[] }
  >,
) => {
  if (!data) data = new Map();

  const lines = data
    .entries()
    .map(([k, v]) => {
      const ps = "[" + v.parameters.join(", ") + "]";
      const fs = "{" + v.fields.map((f) => `${f.k}: ${f.v}`).join("; ") + "}";
      return `  [\`${k}\`]: { parameters: ${ps}; fields: ${fs};}`;
    })
    .toArray();

  return `export interface Queries {
  [k: string]: { parameters: unknown[]; fields: unknown };
${lines.join("\n")}
}`;
};

const msg = (
  loc: string,
  type: "notice" | "warning",
  line1: string,
  line2?: string,
) => {
  console.log(`${loc}: ${type}: ${line1}`);
  if (line2) console.log(`    ${line2}`);
  console.log();
};

const args = parseArgs({
  args: argv.slice(2),
  options: {
    connectionString: { type: "string" },
    definitionsFile: { type: "string", default: "src/defs.gen.ts" },
    tsConfigFile: { type: "string", default: "tsconfig.json" },
  },
});

const project = new Project({ tsConfigFilePath: args.values.tsConfigFile });

const defFile = args.values.definitionsFile;

const hasDef = existsSync(defFile);

if (!hasDef) {
  await writeFile(defFile, head + "\n" + buildQueryObj(), "utf-8");
  project.addSourceFileAtPath(defFile);
  project.resolveSourceFileDependencies();
}

const queries: { query: string; loc: string }[] = [];

const sourceFiles = project.getSourceFiles();
sourceFiles.forEach((file) => {
  const calls = file.getDescendantsOfKind(SyntaxKind.CallExpression);

  calls.forEach((call) => {
    const expression = call.getExpression();

    // Check if it's a property access such as client.query
    if (expression.getKind() === SyntaxKind.PropertyAccessExpression) {
      const propAccess = expression.asKindOrThrow(
        SyntaxKind.PropertyAccessExpression,
      );

      const name = propAccess.getName(); // 'query'
      if (name !== "query") return;
      // Get the type of the expression
      const type = propAccess.getType();

      const { line, column } = file.getLineAndColumnAtPos(call.getStart());

      const loc = `${relative(".", file.getFilePath())}:${line}:${column}`;

      if (!type.getText().endsWith("TypesafeQueryFn")) {
        msg(
          loc,
          "notice",
          `call of ${propAccess.getExpression().getText()}.name is not of type TypesafeQueryFn`,
          `If this call is a database call, type ${propAccess.getExpression().getText()} as TypesafePool, TypesafeClient or TypesafeQuerier`,
        );
        return;
      }

      const arg = call.getArguments().at(0);
      if (!arg) {
        msg(loc, "warning", "call has no arguments");
        return;
      }
      if (
        arg.getKind() !== SyntaxKind.NoSubstitutionTemplateLiteral &&
        arg.getKind() !== SyntaxKind.StringLiteral
      ) {
        msg(
          loc,
          "notice",
          `the argument is a ${arg.getKindName()}, which is unsupported`,
          `pg-typesafe currently supports string literals and template literals with not substitution.`,
        );
        return;
      }

      const txt =
        arg.asKind(SyntaxKind.StringLiteral)?.compilerNode.text ??
        arg.asKind(SyntaxKind.NoSubstitutionTemplateLiteral)?.compilerNode.text;
      assert(txt !== undefined);

      queries.push({ query: txt, loc });
    }
  });
});

const client = new Client({ connectionString: args.values.connectionString });
await client.connect();

const qMap = new Map<
  string,
  { parameters: string[]; fields: { k: string; v: string }[] }
>();
for (const q of queries) {
  try {
    const analyzed = await analyzeQuery(client, q.query);

    if (analyzed === null) {
      qMap.set(q.query, { parameters: [], fields: [] });
    } else {
      const parameters = analyzed.parameters.map((p) =>
        defaultTransformParameter(p),
      );
      const fields = analyzed.fields.map((f) => ({
        k: f.name,
        v: defaultTransformField(f),
      }));
      qMap.set(q.query, { parameters, fields });
    }
  } catch (error) {
    msg(q.loc, "warning", "analyzing this query failed", inspect(error));
  }
}

await client.end();

await writeFile(defFile, head + "\n" + buildQueryObj(qMap), "utf-8");
