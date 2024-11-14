usage:
	just --list

# run this first to install dependencies
setup:
	just yarn
	cargo build

build:
	cargo build
	just build-frontend

# run the backend with dev frontend
run *args="":
	#!/usr/bin/env bash

	set -eux

	just backend {{ args }} &
	just frontend

# open the published website for viewing
open-prod *args="":
	xdg-open "http://tailspin-logview.s3-website-us-west-2.amazonaws.com/"

# run the backend
backend *args="":
	cargo run -- {{ args }}

# run the frontend
frontend:
	cd frontend && yarn webpack serve --mode development --open

# typecheck the frontend
typecheck-ts:
	cd frontend && yarn tsc --watch

# yarn in the frontend
yarn *args="":
	cd frontend && yarn {{ args }}

test *args="":
	just yarn jest {{ args }}

build-frontend:
	cd frontend && yarn webpack --mode production

