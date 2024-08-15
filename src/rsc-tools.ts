#!/usr/bin/env node
import { program } from "@commander-js/extra-typings";

program
  .command(
    "explorer <files...>",
    "See a visual representation of the space used in the RSC",
  )
  .command(
    "repack <files...>",
    "Repack RSC files, compressing them by removing unused data",
  )
  .command("verify <files...>", "Verifies the integrity of RSC files")
  .command("list <files...>", "Lists the files in an RSC")
  .parse();
