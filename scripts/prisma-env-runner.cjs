const fs = require("node:fs");
const { spawnSync } = require("node:child_process");

const env = { ...process.env };

if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    if (!line || /^\s*#/.test(line) || !line.includes("=")) continue;
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^"|"$/g, "");
    if (key) env[key] = value;
  }
}

env.DIRECT_URL = env.DIRECT_URL || env.DATABASE_URL;

const args = process.argv.slice(2);
const command = "npx";

if (args[0] === "migrate-diff-db-to-schema") {
  const output = args[1];
  if (!output) {
    console.error("Missing output file for migrate-diff-db-to-schema.");
    process.exit(1);
  }
  const result = spawnSync(
    command,
    [
      "prisma",
      "migrate",
      "diff",
      "--from-url",
      env.DATABASE_URL,
      "--to-schema-datamodel",
      "prisma/schema.prisma",
      "--script"
    ],
    {
      encoding: "utf8",
      env,
      shell: true
    }
  );
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) console.error(result.error.message);
  if (result.status !== 0) process.exit(result.status ?? 1);
  fs.writeFileSync(output, result.stdout);
  process.exit(0);
}

const result = spawnSync(command, ["prisma", ...args], {
  stdio: "inherit",
  env,
  shell: true
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
