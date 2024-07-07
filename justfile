# run the backend with dev frontend
run *args="":
	#!/usr/bin/env bash

	set -eux

	just backend {{ args }} &
	just frontend

# run the backend with prod frontend
run-prod *args="":
	#!/usr/bin/env bash

	set -eux

	just backend {{ args }} &
	BACKEND_PID=$!
	xdg-open "http://tailspin-logview.s3-website-us-west-2.amazonaws.com/"
	trap cleanup SIGINT
	wait $BACKEND_PID

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
