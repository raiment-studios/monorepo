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
    -   [x] Allow front matter comments to define package versions
    -   [x] Fix resolution of imports from within packages (e.g. `react/dom-client`)
    -   [x] Ensure works properly with namespaced packages
    -   [ ] Cache between runs
    -   [ ] Document package management process
-   [ ] Good practices
    -   [ ] Publicly accessible demo
    -   [ ] Standard Makefile
    -   [ ] Unit tests
    -   [ ] Benchmarks
    -   [x] Publish to package repository
    -   [ ] Add verbose mode (debug, info, warn)
    -   [ ] Add metrics
    -   [ ] Changelog
    -   [ ] Proper release process
-   [ ] Host definition
    -   [ ] Allow basic host definition in front matter
    -   [ ] Document host definition
    -   [ ] Add a renderToString "host" definition

### Backlog

-   [ ] Open browser window if not already open
-   [ ] Modules of multiple files
-   [ ] Automatic deployment

## User documentation

### Front matter

A few goals of `sea-jsx` is to work with single, independent files and avoid cluttering a workspace with configuration files. Another goal is to use JavaScript / JSX that can copied into other projects and it will "just work". A challenge though is `sea-jsx` does require _some_ configuration to handle data that is not easily expressed in compliant JavaScript. As such `sea-jsx` borrows the notion of ["front matter"](https://www.merriam-webster.com/dictionary/front%20matter) [as used in Markdown-like variants](https://assemble.io/docs/YAML-front-matter.html).

**Example**

```javascript
/*!@sea:header

imports:
    lodash: 4

*/

import _ from 'lodash';

export default function() {
    return (<div>{_.snakeCase(Hello World)}</div>);
}
```

`sea-jsx` looks for the first comment using the special sequence `/*!@sea:headder` and parses the contents of that comment as YAML. That object is then used as the `sea-jsx` configuration. In this particular case, the configuration is telling `sea-jsx` to use lodash version 4.

### Configuration options

-   `imports` - a set of key-value pairs specifying the npm version to use when importing that particular package

## Design

The process can be thought of in two parts: (1) creating a "host environment" out of the browser with a known HTML base configuration, (2) executing the given program in that environment.

A future direction is to create a target types of Markdown and extended Markdown that can also be quickly displayed.

### Sea conventions

`sea-jsx` is part of the Sea suite (yes, that's a joke) of tools and attempts to follow the principles of that line of tooling:

-   [x] File-based and git-ops compatible
-   [x] Minimize use of custom or non-standard data formats or languages
