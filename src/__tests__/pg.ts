import { Pool } from "pg";

export const pool = new Pool({
  connectionString: "postgres://postgres:example@localhost",
});
