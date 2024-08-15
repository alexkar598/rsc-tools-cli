#!/usr/bin/env node
import * as fs from "node:fs";
import path from "node:path";
import { MaybeEmptyRscEntry, ResourceType, unpackRsc } from "rsc-tools";
import assert from "node:assert";
import { EXEC_FAIL, safeExec } from "./util.js";
import { Command, Option } from "@commander-js/extra-typings";
import CliTable3 from "cli-table3";
import prettyBytes from "pretty-bytes";

const program = new Command()
  .argument("<files...>")
  .option("-e, --list-empty", "List junk entries in the RSC file", false)
  .option("-j, --json", "Output in JSON format", false)
  .addOption(
    new Option("-H, --no-human-numbers", "Do not list").conflicts("json"),
  )
  .summary("Lists the files in an RSC")
  .parse();

let { listEmpty, json, humanNumbers } = program.opts();
const files = program.args;

const verboseLog = (...args: Parameters<typeof console.log>) =>
  !json ? console.log(...args) : void 0;

let tally_ok = 0;
let tally_failed = 0;

const error = (message: string) => (e: any) => {
  console.error(`${message}\n\t${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
  tally_failed++;
};
const bytes = (bytes: number) =>
  humanNumbers ? prettyBytes(bytes) : bytes.toString();

const json_output = new Array<{
  path: string;
  files: Partial<
    Omit<MaybeEmptyRscEntry, "added" | "modified" | "encrypted"> & {
      added: number;
      modified: number;
    }
  >[];
}>();
for (let file of files) {
  verboseLog(`\n\nContents of ${file}:\n`);
  const table = new CliTable3({
    head: ["Path", "Size", "Type", "Added", "Modified", "Padding_size"],
  });
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
    include_empty: listEmpty,
  });
  if (rsc === EXEC_FAIL) continue;
  if (json) {
    json_output.push({
      path: file,
      files: rsc.map((file) => ({
        ...file,
        padding: undefined,
        content: undefined,
        encrypted: undefined,
        ...(file.used
          ? { added: file.added.valueOf(), modified: file.modified.valueOf() }
          : { added: undefined, modified: undefined }),
      })),
    });
  } else {
    for (const entry of rsc) {
      if (!entry.used) {
        table.push([`(empty)`, bytes(entry.content.length)]);
        continue;
      }
      table.push([
        entry.path,
        bytes(entry.content.length),
        ResourceType[entry.type],
        entry.added.toISOString(),
        entry.modified.toISOString(),
        bytes(entry.padding.length),
      ]);
    }
  }
  if (!json) console.log(table.toString());
  tally_ok++;
}

process.stderr.write(`\n\nSuccessfully processed ${tally_ok} files\n`);
if (tally_failed) console.error(`Failed to process ${tally_failed} files`);
if (json) {
  console.log(JSON.stringify(json_output));
}
