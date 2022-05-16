# 🌊 sea-jsx

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

### 🏁 v1.0 Checkpoints

-   [x] **v0.1: Basic functionality**
    -   [x] Implicitly create index.html & bootstrap.js
    -   [x] Hot-reload on changes
    -   [x] Hello world example
    -   [x] Basic CLI flags
-   [x] **v0.2: Package management**
    -   [x] Load latest version for unspecified packages
    -   [x] Allow front matter comments to define package versions
    -   [x] Fix resolution of imports from within packages (e.g. `react/dom-client`)
    -   [x] Ensure works properly with namespaced packages
    -   [x] Document package management process
    -   [x] Cache modules between runs for fewer fetches
    -   [x] Allow multiple files
    -   [x] Automatically try appending '.js' to imports
    -   [x] Automatically refresh on any imported user file
-   [ ] **v0.3: Allow use as a library**
    -   [ ] Change to `sea-jsx <command> [options]`
    -   [ ] Allow inclusion as a library
    -   [ ] Example external script that publishes a tree (using glob)
-   [ ] **v0.4: Publication**
    -   [x] Allow basic publication definition in front matter
    -   [x] Add GitHub Pages as a publish destination
    -   [ ] Add a renderToString publish definition
    -   [ ] Use production esbuild on publish
-   [ ] **Good practices**
    -   [ ] Publicly accessible demo
    -   [x] Standard Makefile
    -   [ ] Unit tests
    -   [ ] Benchmarks
    -   [x] Publish to package repository
    -   [ ] Add verbose mode (debug, info, warn)
    -   [ ] Add metrics
    -   [ ] Changelog
    -   [ ] Proper release process
-   [ ] **User experience enhancements**
    -   [ ] ➕ Reload the main Component on changes without session reset

### 🎄 Backlog

-   [ ] Open browser window if not already open

## User documentation

### Command-line usage

```
Usage
$ sea-jsx [...flags] <filename>

Flags
  help                  displays help information
  version               displays program version
  verbose               sets verbose output
  build                 builds a bundle
  publish               builds and deploys a bundle
  clean                 removes all cached modules before proceeding
```

### Front matter

While `sea-jsx` is designed to minimize configuration, when it is required (such as to specify a particular package version), a comment-based front matter syntax **can optionally be used** to provide YAML configuration:

**Example**

```javascript
/*!@sea:header

    modules:
        lodash: 4
    publish:
        type: '@raiment/github-pages'
        org: raiment-studios
        path: hello/world.html
*/

import _ from 'lodash';

export default function() {
    return (<div>{_.snakeCase(Hello World)}</div>);
}
```

In this particular case, the package version for `lodash` is pinned to `4` and a deployment target on GitHub Pages is specified so the resulting build can easily be shared publicly.

### Configuration options

-   `modules` - a set of key-value pairs specifying the npm version to use when importing that particular package. Imports not listed in the module configuration will attempt to use the latest available version.

-   `publish` - a configuration describing how to publish the built code. This is intended to support simple destinations for quick public sharing of code.
    -   `type` - currently only `@raiment/github-pages` is supported as a publish type. This will upload the built file to a [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages) respository. This is a minimal effort static HTML hosting target.
    -   `[@raiment/github-pages]` `org` - the name of the GitHub org to publish to
    -   `[@raiment/github-pages]` `path` - the path within the respository to upload the file to. Existing files are that path will be overwritten without confirmation.

## Design

### Primary use case

**Rapid prototyping and experimentation of JSX Components in isolation**

### Design goals

1. Minimal setup and configuration
2. Standard JSX that will be transferable into production code
3. Sharing via rapid, minimal configuration deployment

These design goals follow from the primary use case.

### Sea conventions

`sea-jsx` is part of the `sea` suite (pun intended) of tools and attempts to follow the general workflow principles of the `sea` tooling:

-   [x] File-based and git-ops compatible
-   [x] Minimize use of custom or non-standard data formats or languages

### Architectural overview

The process can be thought of in two parts: (1) creating a "host environment" out of the browser with a known HTML base configuration, (2) executing the given program in that environment.

A future direction is to create a target types of Markdown and extended Markdown that can also be quickly displayed.

### Out of scope

-   **Automatic routing** - sea-jsx is not intended to be a site generator. Routing should be handled via external packages.
-   **Unit testing** - sea-jsx is primarily for rapid prototyping, not production code so has no built-in mechanisms to facilitate unit testing

## FAQ

#### What are some of the reasons to use `sea-jsx`?

It's simple, fast, and doesn't lock you into any non-standard structures or configurations while you're working small, quick prototypes.

#### How does `sea-jsx` compare to, say, [Next.js](https://nextjs.org/)?

sea-jsx does not intend to be a full-fledged site generator. It is intended instead to be quick, easy way to run on individual JSX files (or a small set of them) with minimal configuration. The primary use case is prototyping and rapid experimentation.

#### How do I change the header, page title, add CSS, etc.?

The recommended way is to do so through libraries or the [standard Web APIs](https://developer.mozilla.org/en-US/docs/Web/API/Document).

Here's trivial example of code that could be used put in an outer component to set the page title:

```javascript
React.useEffect(() => {
    document.title = 'My personal homepage (under construction!)';
});
```
