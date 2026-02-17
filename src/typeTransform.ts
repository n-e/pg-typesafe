// https://github.com/brianc/node-pg-types/blob/v2.2.0/lib/textParsers.js#L166

import type { AnalyzeResult } from "./analyzeQuery";

const types: Record<number, { parameter: string; field: string }> = {
  20: { parameter: "string", field: "string" },
  21: { parameter: "number", field: "number" },
  23: { parameter: "number", field: "number" },
  26: { parameter: "number", field: "number" },
  700: { parameter: "number", field: "number" },
  701: { parameter: "number", field: "number" },

  16: { parameter: "boolean", field: "boolean" },

  1082: { parameter: "Date", field: "Date" },
  1114: { parameter: "Date", field: "Date" },
  1184: { parameter: "Date", field: "Date" },

  // 600: { parameter: "Date", field: "Date" }, // TODO point
  651: { parameter: "string[]", field: "string[]" },
  // 718: { parameter: "string[]", field: "string[]" }, // TODO circle
  1000: { parameter: "boolean[]", field: "boolean[]" },
  1001: { parameter: "string[]", field: "string[]" },
  1005: { parameter: "number[]", field: "number[]" },
  1007: { parameter: "number[]", field: "number[]" },
  1028: { parameter: "number[]", field: "number[]" },
  1016: { parameter: "string[]", field: "string[]" },
  // 1017: { parameter: "number[]", field: "number[]" }, // TODO point[]
  1021: { parameter: "number[]", field: "number[]" },
  1022: { parameter: "number[]", field: "number[]" },
  1231: { parameter: "number[]", field: "number[]" },
  1014: { parameter: "string[]", field: "string[]" },
  1015: { parameter: "string[]", field: "string[]" },
  1008: { parameter: "string[]", field: "string[]" },
  1009: { parameter: "string[]", field: "string[]" },
  1040: { parameter: "string[]", field: "string[]" },
  1041: { parameter: "string[]", field: "string[]" },
  1115: { parameter: "Date[]", field: "Date[]" },
  1182: { parameter: "Date[]", field: "Date[]" },
  1185: { parameter: "Date[]", field: "Date[]" },
  // TODO 1186,1187 : interval, intervalArray
  17: { parameter: "string", field: "string" }, // bytea

  // JSON, JSONB
  114: { parameter: "string", field: "unknown" },
  3802: { parameter: "string", field: "unknown" },

  199: { parameter: "string[]", field: "unknown[]" },
  3807: { parameter: "string[]", field: "unknown[]" },

  3907: { parameter: "string[]", field: "string[]" },
  2951: { parameter: "string[]", field: "string[]" },
  791: { parameter: "string[]", field: "string[]" },
  1183: { parameter: "string[]", field: "string[]" },
  1270: { parameter: "string[]", field: "string[]" },

  25: { parameter: "string", field: "string" },
};

export type TransformParameterFn = (parameter: { type_oid: number }) => {
  type: string;
  imports?: { name: string; path: string }[];
};

export type TransformFieldFn = (field: {
  type_oid: number;
  name: string;
  column?: {
    schemaName: string;
    tableName: string;
    columnName: string;
    nullable: boolean;
  };
}) => {
  type: string;
  imports?: { name: string; path: string }[];
};

export const defaultTransformParameter: TransformParameterFn = (param) => {
  const t = types[param.type_oid]?.parameter;
  if (!t) {
    console.log("Unknown type for oid " + param.type_oid);
    return { type: "unknown" };
  }
  return { type: t };
};

export const defaultTransformField: TransformFieldFn = (field) => {
  const t = types[field.type_oid]?.parameter;
  if (!t) {
    console.log("Unknown type for oid " + field.type_oid);
    return { type: "unknown" };
  }

  if (!field.column || field.column.nullable) {
    return { type: `${t} | null` };
  } else return { type: t };
};
