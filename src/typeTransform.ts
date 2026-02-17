// https://github.com/brianc/node-pg-types/blob/v2.2.0/lib/textParsers.js#L166

import type { AnalyzeResult } from "./analyzeQuery";

const types: Record<number, { parameter: string; field: string }> = {
  20: { parameter: "bigint", field: "bigint" },
  21: { parameter: "number", field: "number" },
  23: { parameter: "number", field: "number" },
  26: { parameter: "number", field: "number" },
  700: { parameter: "number", field: "number" },
  701: { parameter: "number", field: "number" },

  16: { parameter: "boolean", field: "boolean" },

  25: { parameter: "string", field: "string" },

  // JSON, JSONB
  114: { parameter: "unknown", field: "unknown" },
  3802: { parameter: "unknown", field: "unknown" },
};

export function defaultTransformParameter(
  param: AnalyzeResult["parameters"][number],
) {
  const t = types[param.type_oid]?.parameter;
  if (!t) {
    console.log("Unknown type for oid " + param.type_oid);
    return "unknown";
  }
  return t;
}

export function defaultTransformField(field: AnalyzeResult["fields"][number]) {
  const t = types[field.type_oid]?.parameter;
  if (!t) {
    console.log("Unknown type for oid " + field.type_oid);
    return "unknown";
  }

  if (!field.column || field.column.nullable) {
    return `${t} | null`;
  } else return t;
}
