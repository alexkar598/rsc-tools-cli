# rsc-tools-cli
Set of CLI utilities to manipulate 

# Installation
Install from [NPM](https://www.npmjs.com/package/rsc-tools-cli)
```bash
npm install -g rsc-tools-cli
rsc-tools --help
```

# Usage

```
Usage: rsc-tools [options] [command]

Options:
  -h, --help           display help for command

Commands:
  explorer <files...>  See a visual representation of the space used in the RSC
  repack <files...>    Repack RSC files, compressing them by removing unused data
  verify <files...>    Verifies the integrity of RSC files
  list <files...>      Lists the files in an RSC
  help [command]       display help for command
```

## Explorer
```
Usage: rsc-tools-explorer [options] <files...>

For --output, the following placeholders may be used:
  • %p: Path to file's directory
  • %f: Filename
  • %b: Filename without extensions
  • %h: File short hash
  • %H: File hash
  • %T: Temp dir

Options:
  -n, --no-open            Do not open report in browser
  -f, --force              Overwrite destination file (default: false)
  -v, --verbose            Defaults to true when less than 6 files are provided
  -o, --output <template>  Output to file (default: "%T/%b-%h.html")
  -h, --help               display help for command
```

## Repack

```
Usage: rsc-tools-repack [options] <files...>

For --output, the following placeholders may be used:
  • %p: Path to file's directory
  • %f: Filename
  • %b: Filename without extensions
  • %h: File short hash
  • %H: File hash
  • %T: Temp dir

Options:
  -f, --force              Overwrite destination file (default: false)
  -n, --dry-run            Print space saved without writing to disk (default: false)
  -v, --verbose            Defaults to true when less than 6 files are provided
  -o, --output <template>  Output to file (default: "%p/%f")
  -h, --help               display help for command
```

## Verify

```
Usage: rsc-tools-verify [options] <files...>

Options:
  -v, --verbose  Defaults to true when less than 6 files are provided
  -h, --help     display help for command
```

## List

```
Usage: rsc-tools-list [options] <files...>

Options:
  -e, --list-empty        List junk entries in the RSC file (default: false)
  -j, --json              Output in JSON format (default: false)
  -H, --no-human-numbers  Do not list
  -h, --help              display help for command
```