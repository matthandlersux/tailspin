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

# install tailspin into ~/.cargo/bin (must be on PATH)
install:
	cargo install --path .

# build release and copy into ./bin (alternative to `just install`)
local-install:
	cargo build --release
	mkdir -p bin
	cp target/release/tailspin bin/tailspin
