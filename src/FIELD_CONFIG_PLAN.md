# JSON Field Config Plan

## Overview

A config file that controls how JSON log fields are parsed, displayed, and prioritized
in both collapsed (abridged) and expanded views.

## Config Location

`~/.config/tailspin/fields.toml` (or passed via `--config <path>`)

## Schema

```toml
# Fields to extract into the abridged (collapsed) single-line view.
# Order here controls display order left-to-right.

[[abridged]]
names = ["level", "severity", "lvl"]  # field name aliases
display = "badge"                      # badge | text | hidden
# badge: colored background pill (e.g. " INFO ")
# text: plain styled text
# hidden: parsed but not shown in abridged

[[abridged]]
names = ["time", "timestamp", "ts", "t", "date", "created_at"]
display = "text"
format = "timestamp"  # timestamp | raw
# timestamp: auto-detect epoch seconds/ms/us/ns and format as ISO
# raw: display value as-is

[[abridged]]
names = ["msg", "message", "text", "body"]
display = "text"
style = "primary"  # primary: white, prominent; secondary: dimmed

# Fields to always show first in expanded JSON view
# (remaining fields shown alphabetically after these)
[expanded]
priority = ["level", "time", "timestamp", "ts", "msg", "message"]

# Custom level color mapping (overrides defaults)
[levels]
trace = "dark_gray"
debug = "cyan"
info  = "light_blue"
warn  = "yellow"
error = "red"
fatal = "magenta"

# Numeric level mapping (e.g. pino/bunyan)
[levels.numeric]
10 = "trace"
20 = "debug"
30 = "info"
40 = "warn"
50 = "error"
60 = "fatal"

# Custom field renderers
# Define how specific field names are rendered in expanded view
[[field_renderer]]
names = ["duration", "elapsed", "latency"]
format = "duration_ms"  # renders "123" as "123ms", "1500" as "1.5s"

[[field_renderer]]
names = ["url", "uri", "path", "href"]
format = "url"          # underlined, clickable-style

[[field_renderer]]
names = ["status", "status_code", "http_status"]
format = "http_status"  # colored by range: 2xx=green, 3xx=cyan, 4xx=yellow, 5xx=red

[[field_renderer]]
names = ["error", "err", "exception", "stack", "stacktrace"]
format = "multiline"    # preserve newlines, red-tinted

[[field_renderer]]
names = ["request_id", "trace_id", "span_id", "correlation_id"]
format = "id"           # dimmed, monospace
```

## Implementation Steps

1. Add `toml` crate dependency
2. Create `src/tui/config.rs` with deserialization structs
3. Load config at startup (with sensible defaults if no file exists)
4. Pass config to `json_viewer::abridged_json_spans()` and `json_viewer::format_json_lines()`
5. Replace hardcoded `LEVEL_FIELDS`, `TIME_FIELDS`, `MSG_FIELDS` constants with config-driven lists
6. Replace hardcoded `level_color()` with config-driven color map
7. Implement custom field renderers (duration_ms, url, http_status, multiline, id)
8. Add `--config` CLI flag to override default config path

## Defaults

If no config file exists, behavior should match current hardcoded logic exactly.
The config only overrides — it doesn't replace the entire system.
