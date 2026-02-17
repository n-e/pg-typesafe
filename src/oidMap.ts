// https://github.com/brianc/node-pg-types/blob/v2.2.0/lib/textParsers.js#L166

const types = {
  21: { parameter: "number", field: "number" },
  23: { parameter: "number", field: "number" },
  26: { parameter: "number", field: "number" },
  700: { parameter: "number", field: "number" },
  701: { parameter: "number", field: "number" },

  16: { parameter: "boolean", field: "boolean" },

  //   114: { parameter: "boolean", field: "boolean" },
  //   3802: { parameter: "boolean", field: "boolean" },
};

const defaultType = { parameter: "unknown", field: "unknown" };
