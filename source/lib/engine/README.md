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

### Directory outline

-   `actors/` - prefab actors
-   `models/` - objects for different data formats and structures often for creating meshes and actors
-   `image/` - utilitie for working with 2D images

### Renderer

⚠️ TODO

### Actor engine methods

```javascript
class Actor {
    // ----------------------------------------------------------------------//
    // Properties
    // ----------------------------------------------------------------------//

    get id() {}

    // False by default
    get flags() {
        return {
            pinToGroundHeight: false,
            castShadow: false,
        };
    }

    get position(): THREE.Vector3 {}
    get velocity(): THREE.Vector3 {}
    get acceleration(): THREE.Vector3 {}

    get shape() {
        return {
            type: '<string>',
        };
    }

    // ----------------------------------------------------------------------//
    // Lifecycle methods
    // ----------------------------------------------------------------------//

    init() {}
    stateMachine(ctx) {}
    initMesh(ctx): THREE.Object3D {}

    update(ctx) {}

    // ----------------------------------------------------------------------//
    // "Plug-in" methods
    // ----------------------------------------------------------------------//

    // If defined, this value will be included in the world ground height
    // calculation
    worldGroundHeight(): number {}
}
```

#### StateMachine

⚠️ TODO

## Design

⚠️ TODO

## FAQ

⚠️ TODO
