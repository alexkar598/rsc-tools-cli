#!/usr/bin/env node
import * as fs from "node:fs";
import { generateHtml } from "source-map-explorer/lib/html.js";
import { FileDataMap } from "source-map-explorer/lib/types.js";
import path, { basename } from "node:path";
import { unpackRsc } from "rsc-tools";
import { BinaryLike, hash } from "node:crypto";
import assert from "node:assert";
import { EXEC_FAIL, safeExec } from "./util.js";
import open from "open";
import { Command } from "@commander-js/extra-typings";
import * as os from "node:os";

const program = new Command()
  .argument("<files...>")
  .option("-n, --no-open", "Do not open report in browser")
  .option("-f, --force", "Overwrite destination file", false)
  .option(
    "-v, --verbose",
    "Defaults to true when less than 6 files are provided",
  )
  .option("-o, --output <template>", "Output to file", "%T/%b-%h.html")
  .summary("See a visual representation of the space used in the RSC")
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
let { open: openReport, output, force, verbose } = program.opts();
const files = program.args;

if (files.length <= 5) verbose = true;

const checksum = (data: BinaryLike) => hash("sha1", data);
const error = (message: string) => (e: any) => {
  console.error(`${message}\n\t${e instanceof Error ? e.message : e}`);
  process.exitCode = 1;
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
  );
  if (rsc === EXEC_FAIL) continue;
  verboseLog(`Parsed: ${file}`);

  const files: FileDataMap = {};
  for (const file of rsc) {
    if (!file.used) {
      files[`(meta)/holes/${checksum(file.content)}`] = {
        size: file.content.length,
      };
      continue;
    }

    // noinspection JSNonASCIINames
    const path = `${file.path} • ${checksum(file.content)}`;
    files[path] = { size: file.content.length };
    if (file.padding.byteLength) {
      files[`(meta)/padding/${path}`] = { size: file.padding.length };
    }
  }

  const html = generateHtml(
    [
      {
        bundleName: basename(file),
        totalBytes: inFile.byteLength,
        files,
        mappedBytes: -Infinity,
        eolBytes: -Infinity,
        sourceMapCommentBytes: -Infinity,
      },
    ],
    {},
  );
  const outputPath = output
    .replaceAll("%p", path.dirname(file))
    .replaceAll("%f", path.basename(file))
    .replaceAll("%b", path.basename(file.substring(0, file.lastIndexOf("."))))
    .replaceAll("%h", hash("sha1", html).substring(0, 8))
    .replaceAll("%H", hash("sha1", html))
    .replaceAll("%T", os.tmpdir());
  const saved =
    safeExec(
      fs.writeFileSync,
      error(`Failed to save ${outputPath}. Are you missing a --force option?`),
      outputPath,
      html,
      { flag: force ? "w" : "wx" },
    ) !== EXEC_FAIL;

  if (openReport) void open(outputPath);
  if (!saved) continue;
  verboseLog(`Saved ${outputPath}`);
}
