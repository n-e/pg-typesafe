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

  /**
   * List of files or directories to ignore. It doesn't support paths (aa/bb) nor globs
   * @example ['__tests__', 'bad_file.ts']
   */
  ignoreFiles?: string[];

  transformParameter?: TransformParameterFn;
  transformField?: TransformFieldFn;
}

export const defineConfig = (config: PgTypesafeConfig) => config;
