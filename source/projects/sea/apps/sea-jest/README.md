# sea-jest

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/raiment-studios/monorepo?filename=source%2Fprojects%2Fsea%2Fapps%2Fsea-jest%2Fpackage.json)
![](https://img.shields.io/badge/license-MIT-039)
[![](https://img.shields.io/badge/feedback-welcome!-1a6)](https://github.com/raiment-studios/monorepo/discussions)

A wrapper on Jest to avoid needing to add configuration files to a project.

## Getting started

Step 1: install sea-jest

```bash
npm install --save @raiment/sea-jest
```

Step 2: Add sea-jest to your Makefile

```make
.PHONY: test
test:
    npx sea-jest --verbose .
```

## Vision

⚠️ TODO

## Roadmap

### v1.0 Checkpoints

-   [x] v0.1 Basic functionality
    -   [x] Invoke jest and pass all arguments
    -   [x] Encapsulate jest dependencies (so no user install is needed)
-   [ ] v0.2 Testing
    -   [ ] Add a `--help` flag that `sea-jest` catches
    -   [ ] Add a `--version` flag that `sea-jest` catches
    -   [ ] Add basic colors to match sea conventions
-   [ ] TODO
    -   [ ] todo
    -   [ ] todo
    -   [ ] todo
    -   [ ] todo
-   [ ] TODO
    -   [ ] todo
    -   [ ] todo
    -   [ ] todo
    -   [ ] todo

## User documentation

`sea-jest` is a wrapper on Jest that applies the following configuration:

1. **ES6 by default**: `esbuild-jest` is used as a transform by default
2. **Snapshots stored side-by-side with test files**: this is an opinionated preference over the separate `__snapshots__` folder.

`sea-jest` is a wrapper that invokes `jest` internally so all flags are passed directly from `sea-jest` to `jest`.

## Design

⚠️ TODO

## FAQ

#### Why not just use `jest` directly instead of `sea-jes`?

For many users, this will be the right choice!

`sea-jest` was created as minimal wrapper to avoid the duplicate boilerplate common to all Raiment Studios projects. 
