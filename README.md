# Tailspin

A lightweight terminal log viewer for local development. Tail one or many log
files with JSON expansion, regex search, multi-file tabs, and follow mode.

![screenshot](./screenshot.png)

## Quickstart

Tailspin is in beta and not yet distributed through a package manager. Build
from source with cargo:

```
git clone git@github.com:matthandlersux/tailspin.git
cd tailspin
cargo install --path .
tailspin path/to/logfile1.log path/to/logfile2.log
```

This installs the `tailspin` binary into `~/.cargo/bin` — make sure that's on
your `PATH`.

Alternatively, `just local-install` builds a release binary into `./bin/tailspin`
inside the repo if you'd rather not install system-wide.

## Features

- Multi-file tailing with per-file tabs and a combined view
- Abridged JSON rows (level / time / msg) that expand to a pretty-printed tree
- Trace-id correlation: rows with a `traceId` / `trace_id` key are marked in the gutter; press `l` to filter to all rows sharing that trace across every file
- Regex search with highlighting across plain, abridged, and expanded content
- Enter to expand JSON or wrap a long plain line onto multiple rows
- Fuzzy file picker for fast tab switching
- ANSI escape codes stripped by default to prevent display glitches (toggle with `a`)
- Log-level color coding and syntax highlighting for timestamps, dates, and quoted strings
- Auto-scroll follow mode
- Mouse support: click to select, scroll to move cursor, click the gutter arrow to toggle expand

## Keybindings

| Key | Action |
| --- | --- |
| `/` | start search |
| `n` / `p` | next / previous match |
| `l` | filter to all rows sharing the cursor row's trace id (Esc to exit) |
| `j` / `k` or arrows | move cursor |
| `PageUp` / `PageDown` | page up / down |
| `g` / `G` or `Home` / `End` | jump to top / bottom |
| `Enter` | expand JSON, or wrap a plain line (toggle) |
| `e` | expand / collapse all JSON |
| `a` | toggle ANSI-code stripping |
| `f` | toggle follow mode |
| `Tab` / `Shift-Tab` | next / previous tab |
| `` ` `` or `0` | combined view |
| `1`..`9` | jump to tab N |
| `@` or `t` | fuzzy file picker |
| `?` | help overlay |
| `Ctrl+C` | quit |

## Building

Requires Rust (cargo). Common commands are in the [justfile](https://github.com/casey/just):

```
just build            # debug build
just build-release    # release build
just run path/to/log  # run from source (debug)
just run-release path/to/log
just install          # cargo install --path . (into ~/.cargo/bin)
just local-install    # release build + copy to ./bin/tailspin
```
