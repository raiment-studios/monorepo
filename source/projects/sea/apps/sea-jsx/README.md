# sea-jsx

A host for running a JSX React function with hot reloading.

## Vision

A quick, simple command-line tool to run single JavaScript React Components with hot-reloading without an project setup. This allows quick experimentation and iteration without spending time on initial boilerplate and without cluttering workspaces with configuration and intermediate files.

## Checkpoints

* [ ] Basic functionality
    * [x] Implicitly create index.html & bootstrap.js
    * [x] Hot-reload on changes
    * [ ] Open browser window if not already open
    * [x] Hello world example
    * [x] Basic CLI flags
* [ ] Package management
    * [ ] What happens when a module is referenced?
* [ ] Good praactices
    * [ ] Standard Makefile
    * [ ] Unit tests
    * [ ] Benchmarks
    * [ ] Publish to package repository
    * [ ] Add verbose mode (debug, info, warn)
    * [ ] Add metrics
* [ ] Host definition
    * [ ] Normalization
    * [ ] Basic themeing

## Design

The process can be thought of in two parts: (1) creating a "host environment" out of the browser with a known HTML base configuration, (2) executing the given program in that environment.

A future direction is to create a target types of Markdown and extended Markdown that can also be quickly displayed.