# sea-jsx

A host for running a JSX React function with hot reloading.


## Vision

A command-line tool to run on a single JavaScript file with hot-reloading allowing quick experimentation without (1) extensive initial boilerplate setup or (2) a directory cluttered with configuration and intermediate files.

The process can be thought of in two parts: (1) creating a "host environment" out of the browser with a known HTML base configuration, (2) executing the given program in that environment.

Eventually these can be treated as individual blocks or nodes in a Sea system graph.

## Checkpoints

* [ ] Hello World React app
    * [ ] Implicitly create index.html & normalize
    * [ ] Implicitly create bootstrap container
    * [ ] Open browser window if not already open
    * [x] Hot-reload on changes
    * [ ] Chalk
* [ ] Clean-up
    * [ ] Add [meow](https://github.com/sindresorhus/meow) or other standard CLI flag handler
* [ ] Host definition
    * [ ] Normalization
    * [ ] Basic themeing

