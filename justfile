# run the backend
run *args="":
	#!/usr/bin/env bash

	set -eux

	just backend {{ args }} &
	just frontend

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
