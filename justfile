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

# build release and copy into ./bin
install:
	cargo build --release
	cp target/release/tailspin bin/tailspin
