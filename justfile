usage:
	just --list

build:
	cargo build

build-release:
	cargo build --release

# run the tui against one or more log files
run *args="":
	cargo run -- {{ args }}

run-release *args="":
	cargo run --release -- {{ args }}

# build release and copy into ./bin (local-only; not a system install)
local-install:
	cargo build --release
	mkdir -p bin
	cp target/release/tailspin bin/tailspin
