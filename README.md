# 🐬 Raiment Studios monorepo

[![](https://img.shields.io/badge/license-MIT-039)](https://github.com/raiment-studios/monorepo#license) [![unit tests](https://github.com/raiment-studios/monorepo/actions/workflows/unit-test.yml/badge.svg)](https://github.com/raiment-studios/monorepo/actions) ![GitHub commit activity](https://img.shields.io/github/commit-activity/m/raiment-studios/monorepo) ![GitHub last commit](https://img.shields.io/github/last-commit/raiment-studios/monorepo) [![](https://img.shields.io/badge/dev-CHANGELOG-14D)](https://github.com/raiment-studios/monorepo#changelog) [![](https://img.shields.io/badge/discussions-welcome!-489)](https://github.com/raiment-studios/monorepo/discussions) [![](https://img.shields.io/badge/chat-zulip-386)](https://raiment-studios.zulipchat.com/)

## What is the Raiment?

**Raiment is an adventure game borrowing from the tradition of classics such as Sierra Online's original King's Quest and mixing in the expansiveness of promised from Bethesda's Daggerfall. Pixelated, voxel-based arts gives Raiment a unique visual style. It is a game designed ot be equally enjoyable to play as it is to contribute to.**

https://user-images.githubusercontent.com/65878718/162589896-58fd3b08-50e6-49df-ac4d-e45653a95dbb.mp4

## Status

[![](https://img.shields.io/badge/status-not%20yet%20ready!-d53)](https://raiment-studios.zulipchat.com/)

The Raiment game itself is in **early development and there is no public, playable version yet available!** This respository contains the tools and content being built that eventually will support the game.

The projects within Raiment include worldbuilding content (art, stories, assets, etc.), a rulebook, a voxel-based game engine, and a set of tools designed to make contributions easy. Please take a look at our [Vision statement](source/projects/organization/vision.md) to see if this is a project you'd like to contribute to!

## Design

-   **Ease and enjoyable to contribute to**: a friendly community and straightforward process to make small contributions possible for anyone
-   **Visually appealing and also accessible on low-end devices**

![image](https://user-images.githubusercontent.com/65878718/162591525-b9be3729-4611-4c85-9146-ce003426f3d6.png)

_The Raiment uses a deck-based approach to procedurally create the world. Users define the deck they want to use for a play-through and those cards effectively become the "mods" that define that playythrough._

## Projects

Project work is categorized into the following:

-   [**Organization**](source/projects/organization) - guidelines on how we work aimed to make contributions easier
-   [**Worldbuilding**](source/projects/worldbuilding) - open-content describing the world of Kestrel, including a rulebook, concept art, etc.
    -   Rulebook
    -   Concept art
    -   Encyclopedia
    -   Novel series
    -   Short stories
-   [**Adventure**](source/projects/adventure) - voxel-based, open-world adventure rpg
    -   Release 0: [**Storytelling**](source/projects/adventure/00-storytelling) - computer-aided "pen & paper" storytelling procedural rpg
    -   Release 1: [**Graham's Quest**](source/projects/adventure/01-grahams-quest/) - a simple 2D implementation
    -   Release 2: [**Snow Globe**](source/projects/adventure/02-snow-globe/) - a single-region, "snow globe" voxel-based world
    -   Release 3: [**Rivia**](source/projects/adventure/03-rivia/) - a 2.5D/3D voxel-based world
    -   Release 4: [**Jaskier's Tale**](source/projects/adventure/04-jaskiers-tale/) - a fully dynamic 3D voxel-based world
    -   Release 5: [**Morgan Claire**](source/projects/adventure/05-morgan-claire/) - distributed, multiplayer multiverse
-   **Libraries**
    -   [**Core**](source/lib/core) - general utilities used across projects
    -   [**Engine**](source/lib/engine) - the game engine tailored to Raiment's voxel world
    -   [**React-Ex**](source/lib/react-ex) - React utilities & extensions used across projects
-   [**Sea**](source/projects/sea) - a opinionated mix of intertwined development & productivity tools
    -   [**sea-jsx**](source/projects/sea/apps/sea-jsx) - app for quickly prototyping React Components
    -   [**sea-jest**](source/projects/sea/apps/sea-jest) - wrapper on Jest to avoid config file clutter
    -   [**sea-todo**](source/projects/sea/apps/sea-todo) - example todo web app ([demo](https://todo.raiment.studio/))
    -   [**sea-raytracer**](source/projects/sea/apps/sea-raytracer) - example application
-   [**Website**](source/projects/website)
    -   [**raiment-studios.github.io**](source/projects/website) - public website ([view](https://raiment-studios.github.io/))

## Technology / Architecture

The project is currently coded primarily in `JavaScript` in order to rapidly flesh out the first prototypes of the project and ensure they are easily accesible on the web. After the initial prototyping stabilizes, the project intends to migrate towards a `Rust` and `JavaScript` mix, utilizing `WASM` when appropriate. See [tools](source/projects/organization/tools.md) for more details.

The goal is to develop an engine separately from the game itself to allow for variations and different stories to be told by the community.

## Contributing

For more details, see the [contributing page](source/projects/organization/contributing.md)!

## Community

-   [Chat Server](https://raiment-studios.zulipchat.com/)
-   [Discussion forums](https://github.com/raiment-studios/monorepo/discussions)
-   [npm registry](https://www.npmjs.com/package/@raiment)

## FAQ

⚠️TODO

## Acknowledgements

⚠️TODO

## License

All code and content within this repository, unless specifically noted otherwise, is licensed under the **[MIT License](./LICENSE)**.

```
MIT License

Copyright (c) 2022 Raiment Studios

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Unless stated explicitly otherwise, any contribution intentionally submitted for inclusion in this repository or otherwise to the project shall be licensed as stated above without any additional terms or conditions.

## CHANGELOG

➕ new or improved functionality, 🗃️ internal organization or code improvements, 🛠️ defect fix, 📣 publication or release, 🧬 for sandboxes or experiments, 📚 documentation, guides, or tutorials

-   [x] ➕🗃️🛠️📣🧬📚

#### 2022

-   Week 23
    -   [x] 🗃️ Move to `@raiment/core` to `fast-mersenne-twister` for performance
    -   [x] 🛠️ Simplify `sea-jsx` `glob:` to return URLs only
    -   [x] ➕ Add engine `goal` mixin
    -   [x] ➕ Add `updateInternval` to Actor
    -   [x] 🛠️ Fix shadows in DayNightLighting (dist was past frustum extents)
    -   [x] ➕ Improve Layers on `HeightMap` actor (can include lookup tables)
    -   [x] ➕ Add components/mixins to `Actor`
    -   [x] 🗃️ Miscellaneous small optimizations
-   Week 22
    -   [x] ➕ `Cursor2D` to `@raiment/core`
    -   [x] ➕ `SimpleStats` to `@raiment/core`
    -   [x] 🧬 Add experimental `fs` support to `sea-jsx` for faster iteration
    -   [x] ➕ Add `DataReader` to `@raiment/core`
    -   [x] 🗃️ Begin migration from `mesh()` to `initMesh()` method
    -   [x] ➕ Add `VOXActor`
    -   [x] ➕ Add `VoxelModelSG` for simple voxel mesh creation
    -   [x] ➕ Add voxel models to website assets page
-   Week 21
    -   [x] 🧬 Add `engine.journal`
    -   [x] 🧬 Add player movement example (click -> pathfind)
    -   [x] 🧬 Add weather example (rain, snow)
    -   [x] ➕ Add `engine.opt` field for customization
    -   [x] 🧬 Add farming example
    -   [x] 🗂️ Rewrite path finding code for reusability
    -   [x] ➕ Add assets page to website
    -   [x] ➕ Allow `StateMachine` states to return `Promise`s
    -   [x] 🧬 Add pathfinding to examples
    -   [x] 🧬 Add Forest to examples
    -   [x] ➕ Add `Map3D`, `clamp` to `core`
    -   [x] ➕ Add additional 32x32 sprites to the assets directory
    -   [x] ➕ Add `castShadow` flag
    -   [x] ➕ Add `billboard` flag
    -   [x] ➕ Add `pinToGroundHeight` flag
    -   [x] ➕ Allow env variables in `glob:` syntax
    -   [x] 🗃️ Create shared `assets/` directory
    -   [x] ➕ Allow `async mesh()` Actor methods
    -   [x] ➕ Added `VoxelSprite`, `ImageGeometryCache` to `engine`
    -   [x] ➕ Add `loadImage`, `getImagePixelData` to `engine
    -   [x] 🧬 Added the [VoxelSprite demo](https://raiment-studios.github.io/engine/examples/10-sprite)
    -   [x] 🧬 Experiment with `glob:` imports for external assets in `sea-jsx`
-   Week 20
    -   [x] 🗃️ Clean up HeightMap actor for general reuse
    -   [x] 🧬 Add dynamic terrain updating example
    -   [x] ➕ Incorporate StateMachine into `@raiment/engine` Actor handling
    -   [x] 🛠️ Fix watch for `..` imports in `sea-jsx`
    -   [x] 🛠️ Fix `clean` command in `sea-jsx`
    -   [x] ➕ Add formatNumber to `@raiment/core`
    -   [x] ➕ Add EngineRecorder (webm capture) component to `@raiment/engine`
    -   [x] ➕ Add Flex component to `@raiment/react-ex`
    -   [x] ➕ Add source map to `sea-jsx`
    -   [x] ➕ Improve `sea-jsx` error handling
    -   [x] ➕ Add simplex noise to `@raiment/core`
    -   [x] 🧬 Start `sea-jsx` v0.3.0
    -   [x] ➕ Update rcd to chdir to exact matches
    -   [x] ➕ Add seed, reset, shuffle to RNG
    -   [x] 📚 initial stab at some `@raiment/core` docs
    -   [x] 🧬 Experiment kicking off [website project](source/projects/website)
    -   [x] 📚 Update [tools page](source/projects/organization/tools.md)
-   Week 19
    -   [x] ➕ Add option to bind object to `StateMachine`
    -   [x] ➕ Add `RendererHUD` to `@raiment/engine` for FPS
    -   [x] ➕ Add `StateMachine` to `@raiment/engine` (and example)
    -   [x] 🛠️ Fix import resolution in `sea-jsx` for extensions-less files
    -   [x] ➕ Add minification to `sea-jsx` published builds
    -   [x] ➕ Add RNG.sign() to `@raiment/core`
    -   [x] ➕ Add `FrameLoop` to `@raiment/engine`
    -   [x] 🛠️ Fix file watching for `sea-jsx` directory imports
    -   [x] ➕ Add `sea-jsx` support to publish to GitHub Pages
    -   [x] 🧬 Add sandbox for GitHub repo [file access](source/sandbox/github/file-access/) via web
-   Week 18
    -   [x] 🗃️ Remove npm tgz packaging build and file:// references from projects
    -   [x] ➕ Add "remember last file" to sea-todo
    -   [x] ➕ `sea-jsx --build` now creates a single index.html with inlined JS
    -   [x] 📣 `sea-todo` publishes to todo.raiment.studio
-   Week 17
    -   [x] 🗃️ Simplify publishing npm packages (using Codespace secrets)
    -   [x] 📚 Created `CHANGELOG.md`
    -   [x] 🛠️ Fix automated builds to workaround package-lock.json not liking tgz changes
    -   [x] 🗃️ Organize / improve `sea-todo` database code
    -   [x] ➕ Add `sea-jsx` watch/refresh on all referenced user files
    -   [x] ➕ Add EventEmitter to `@raiment/core`

#### Before that...

-   [x] 🦕 [_Prehistory_](https://en.wikipedia.org/wiki/Prehistory)
