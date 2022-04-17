# sea-jsx

A quick, simple command-line tool to run single JavaScript React Components with hot-reloading without tedious project configuration.

## Vision

A quick, simple command-line tool to run single JavaScript React Components with hot-reloading without tedious project configuration.  This allows quick experimentation and iteration without spending time on initial boilerplate and without cluttering workspaces with configuration and intermediate files.

## Checkpoints

* [ ] Basic functionality (v0.1)
    * [x] Implicitly create index.html & bootstrap.js
    * [x] Hot-reload on changes
    * [x] Hello world example
    * [x] Basic CLI flags
* [ ] Package management (v0.2)
    * [ ] What happens when a module is referenced?
* [ ] Good practices
    * [ ] Standard Makefile
    * [ ] Unit tests
    * [ ] Benchmarks
    * [ ] Publish to package repository
    * [ ] Add verbose mode (debug, info, warn)
    * [ ] Add metrics
* [ ] Host definition
    * [ ] Normalization
    * [ ] Basic themeing
* [ ] Backlog
    * [ ] Open browser window if not already open

## Design

The process can be thought of in two parts: (1) creating a "host environment" out of the browser with a known HTML base configuration, (2) executing the given program in that environment.

A future direction is to create a target types of Markdown and extended Markdown that can also be quickly displayed.