# Tailspin

A lightweight, open-source tool designed to streamline local log file monitoring
during development. It consists of:

* Rust Binary: a minimal and auditable log file watcher that sends each new line
  as a websocket message
* Web GUI: a flexible interface for viewing and navigating log data over
  websockets

Tailspin is ideal for local development environments with multiple services&mdash;a
simpler alternative to crowded terminal outputs or 3rd party SaaS tools that
don't work for local logs.

![screenshot](./screenshot.png)

## Quickstart

* `git checkout git@github.com:matthandlersux/tailspin.git`
* `cd tailspin && cargo build`
* `./bin/tailspin-prod path/to/logfile1.log path/to/logfile2.log`

## Installation and Usage

currently you have to clone the repo and build things locally. helpful commands
located in a [justfile](https://github.com/casey/just).

for convenience, the latest version of the web app is published here:
http://tailspin-logview.s3-website-us-west-2.amazonaws.com/ ...but you can run
it locally and/or hack together your own viewer. the webapp automatically
attempts to open a websocket connection to `localhost:8088/ws` and if it
connects, it starts loading. so after you run the binary, your options are:
* use the published webapp
* use a locally running webapp (that you can fork/hack on)
* rewrite a frontend

additionally, you can add `$THIS_FOLDER/bin` to your path and run
`tailspin-prod` which will run the binary (assuming it's been built already)
and open the most recently published version of the webapp.

