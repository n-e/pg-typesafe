import {
  defaultTransformField,
  defaultTransformParameter,
  type TransformFieldFn,
  type TransformParameterFn,
} from "./typeTransform";

export { defaultTransformField, defaultTransformParameter };
export type { TransformFieldFn, TransformParameterFn };

export interface PgTypesafeConfig {
  tsConfigFile?: string;
  definitionsFile?: string;
  connectionString?: string;

  transformParameter?: TransformParameterFn;
  transformField?: TransformFieldFn;
}

export const defineConfig = (config: PgTypesafeConfig) => config;
