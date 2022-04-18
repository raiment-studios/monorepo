# sea-jsx

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/raiment-studios/monorepo?filename=source%2Fprojects%2Fsea%2Fapps%2Fsea-jsx%2Fpackage.json)
![](https://img.shields.io/badge/license-MIT-039)
[![](https://img.shields.io/badge/feedback-welcome!-1a6)](https://github.com/raiment-studios/monorepo/discussions)

A quick, simple command-line tool to run single JavaScript React Components with hot-reloading without tedious project configuration.

## Getting started

Step 1: install sea-jsx

```bash
npm install --global @raiment/sea-jsx
```

Step 2: Create a simple JSX file (`hello-world.js`)

```javascript
import React from 'react';

export default function () {
    return <h1>Hello World!!</h1>;
}
```

Step 3: Run sea-jsx see the output. Any updates to `hello-world.js` will hot-reload.

```bash
sea-jsx hello-world.js
```

## Vision

A quick, simple command-line tool to run single JavaScript React Components with hot-reloading without tedious project configuration. This allows quick experimentation and iteration without spending time on initial boilerplate and without cluttering workspaces with configuration and intermediate files.

## Roadmap

### v1.0 Checkpoints

-   [x] Basic functionality (v0.1)
    -   [x] Implicitly create index.html & bootstrap.js
    -   [x] Hot-reload on changes
    -   [x] Hello world example
    -   [x] Basic CLI flags
-   [ ] Package management (v0.2)
    -   [x] Load latest version for unspecified packages
    -   [ ] Allow "front-matter" comments to define package versions
    -   [ ] Cache between runs
    -   [ ] Document package management process
    -   [ ] Fix resolution of imports from within packages (e.g. `react/dom-client`)
-   [ ] Good practices
    -   [ ] Publicly accessible demo
    -   [ ] Standard Makefile
    -   [ ] Unit tests
    -   [ ] Benchmarks
    -   [x] Publish to package repository
    -   [ ] Add verbose mode (debug, info, warn)
    -   [ ] Add metrics
-   [ ] Host definition
    -   [ ] Allow basic host definition in "front-matter"
    -   [ ] Document host definition

### Backlog

-   [ ] Open browser window if not already open
-   [ ] Modules of multiple files
-   [ ] Automatic deployment

## Design

The process can be thought of in two parts: (1) creating a "host environment" out of the browser with a known HTML base configuration, (2) executing the given program in that environment.

A future direction is to create a target types of Markdown and extended Markdown that can also be quickly displayed.
