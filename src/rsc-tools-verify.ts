#!/usr/bin/env node
import * as fs from "node:fs";
import path from "node:path";
import { unpackRsc } from "rsc-tools";
import assert from "node:assert";
import { EXEC_FAIL, safeExec } from "./util.js";
import { Command } from "@commander-js/extra-typings";

const program = new Command()
  .argument("<files...>")
  .option(
    "-v, --verbose",
    "Defaults to true when less than 6 files are provided",
  )
  .summary("Verifies the integrity of RSC files")
  .parse();

let { verbose } = program.opts();
const files = program.args;

if (files.length <= 5) verbose = true;

let tally_ok = 0;
let tally_failed = 0;

const error = (message: string) => (e: any) => {
  console.error(`${message}\n\t${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
  tally_failed++;
};
const verboseLog = (...args: Parameters<typeof console.log>) =>
  verbose ? console.log(...args) : void 0;

for (let file of files) {
  file = path.resolve(process.cwd(), file);

  const inFile = safeExec(
    fs.readFileSync,
    error(`Failed to open ${file}. Skipping`),
    file,
  );
  if (inFile == EXEC_FAIL) continue;
  assert(typeof inFile !== "string");
  let rsc = safeExec(unpackRsc, error(`Failed: ${file}`), inFile, {
    validate_checksums: true,
    include_empty: false,
  });
  if (rsc === EXEC_FAIL) continue;
  verboseLog(`Verified: ${file}`);
  tally_ok++;
}

console.log(`\n\nSuccessfully processed ${tally_ok} files`);
if (tally_failed) console.error(`Failed to process ${tally_failed} files`);
