import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const config = {
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || "",
  AUTH_URL: process.env.AUTH_URL || "",
};

mkdirSync(publicDir, { recursive: true });

const content = `window.STUDIGO_CONFIG = ${JSON.stringify(config, null, 2)};\n`;

writeFileSync(join(publicDir, "config.js"), content, "utf-8");
console.log("Generated public/config.js");