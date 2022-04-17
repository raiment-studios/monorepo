# sea-jsx

A host for running a JSX React function with hot reloading.

## Vision

A quick, simple command-line tool to run single JavaScript React Components with hot-reloading without an project setup. This allows quick experimentation and iteration without spending time on initial boilerplate and without cluttering workspaces with configuration and intermediate files.

## Checkpoints

* [ ] Hello World React app
    * [ ] Implicitly create index.html & normalize
    * [ ] Implicitly create bootstrap container
    * [ ] Open browser window if not already open
    * [x] Hot-reload on changes
* [ ] Package management
    * [ ] What happens when a module is referenced?
* [ ] Clean-up
    * [ ] Chalk
    * [ ] Add [meow](https://github.com/sindresorhus/meow) or other standard CLI flag handler
* [ ] Host definition
    * [ ] Normalization
    * [ ] Basic themeing

## Design

The process can be thought of in two parts: (1) creating a "host environment" out of the browser with a known HTML base configuration, (2) executing the given program in that environment.
