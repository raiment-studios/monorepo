# @raiment/engine

![GitHub package.json version (subfolder of monorepo)](https://img.shields.io/github/package-json/v/raiment-studios/monorepo?filename=source%2Flib%2Fengine%2Fpackage.json)
![](https://img.shields.io/badge/license-MIT-039)
[![](https://img.shields.io/badge/feedback-welcome!-1a6)](https://github.com/raiment-studios/monorepo/discussions)

A JavaScript + WASM simulation and game engine built on top of THREE.js.

## Getting started

⚠️ TODO

## Vision

⚠️ TODO

## Roadmap

⚠️ TODO

## User documentation

### Renderer

⚠️ TODO

### Actor engine methods

#### `position`

If defined, this is expected to be a `THREE.Vector3` that defines the actor position.

-   Rendered meshes will automatically sync their position to this value
-   Physics and collision detecting will use this in calculations

#### `flags()`

`pinToWorldGround` - if set, the engine will force the actor's z position to be set to the world ground height at the actor's x, y.

#### `init()`

#### `stateMachine()`

#### `update()`

#### `mesh()`

### `worldGroundHeight()`

If define, when the "ground height" for a given point in the world is determined, this function will be called.

#### StateMachine

⚠️ TODO

## Design

⚠️ TODO

## FAQ

⚠️ TODO
