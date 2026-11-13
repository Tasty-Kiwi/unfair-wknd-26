import { DatabaseSync } from "node:sqlite";
import { betterAuth } from "better-auth";
import { authOptions } from "../worker/auth-options";

// Generation only: this empty connection cannot access remote D1 or user data.
export const auth = betterAuth({
  ...authOptions(
    "http://localhost:5173",
    "schema-generation-only-not-a-runtime-secret",
  ),
  database: new DatabaseSync(":memory:"),
});
