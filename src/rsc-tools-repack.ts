#!/usr/bin/env node
import * as fs from "node:fs";
import path from "node:path";
import { packRsc, RscEntry, unpackRsc } from "rsc-tools";
import { hash } from "node:crypto";
import assert from "node:assert";
import { EXEC_FAIL, safeExec } from "./util.js";
import { Command, Option } from "@commander-js/extra-typings";
import * as os from "node:os";
import prettyBytes from "pretty-bytes";

const program = new Command()
  .argument("<files...>")
  .option("-f, --force", "Overwrite destination file", false)
  .addOption(
    new Option("-n, --dry-run", "Print space saved without writing to disk")
      .default(false)
      .implies({ verbose: true }),
  )
  .option(
    "-v, --verbose",
    "Defaults to true when less than 6 files are provided",
  )
  .option("-o, --output <template>", "Output to file", "%p/%f")
  .summary("Repack RSC files, compressing them by removing unused data")
  .description(
    `For --output, the following placeholders may be used:
  • %p: Path to file's directory
  • %f: Filename
  • %b: Filename without extensions
  • %h: File short hash
  • %H: File hash
  • %T: Temp dir`,
  )
  .parse();
let { output, force, verbose } = program.opts();
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
  let rsc = safeExec(
    unpackRsc,
    error(`Failed to parse ${file}. Skipping`),
    inFile,
    {
      validate_checksums: false,
      include_empty: false,
    },
  ) as typeof EXEC_FAIL | RscEntry[];
  if (rsc === EXEC_FAIL) continue;
  verboseLog(`Parsed: ${file}`);

  for (const file of rsc) {
    if (file.padding.byteLength) file.padding = new Uint8Array();
  }
  const repacked = Buffer.from(packRsc(rsc));

  const outputPath = output
    .replaceAll("%p", path.dirname(file))
    .replaceAll("%f", path.basename(file))
    .replaceAll("%b", path.basename(file.substring(0, file.lastIndexOf("."))))
    .replaceAll("%h", hash("sha1", repacked).substring(0, 8))
    .replaceAll("%H", hash("sha1", repacked))
    .replaceAll("%T", os.tmpdir());
  const saved =
    safeExec(
      fs.writeFileSync,
      error(`Failed to save ${outputPath}. Are you missing a --force option?`),
      outputPath,
      repacked,
      { flag: force ? "w" : "wx" },
    ) !== EXEC_FAIL;

  if (!saved) continue;
  verboseLog(
    `Saved ${outputPath}\n\tOld Size: ${prettyBytes(inFile.byteLength)} | New Size ${prettyBytes(repacked.byteLength)} | Saved ${inFile.byteLength - repacked.byteLength}`,
  );
  tally_ok++;
}

console.log(`\n\nSuccessfully processed ${tally_ok} files`);
if (tally_failed) console.error(`Failed to process ${tally_failed} files`);
