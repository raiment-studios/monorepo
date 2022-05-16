# Raiment Studios monorepo

[![](https://img.shields.io/badge/license-MIT-039)](https://github.com/raiment-studios/monorepo#license) [![unit tests](https://github.com/raiment-studios/monorepo/actions/workflows/unit-test.yml/badge.svg)](https://github.com/raiment-studios/monorepo/actions) ![GitHub commit activity](https://img.shields.io/github/commit-activity/w/raiment-studios/monorepo) ![GitHub last commit](https://img.shields.io/github/last-commit/raiment-studios/monorepo) [![](https://img.shields.io/badge/dev-CHANGELOG-14D)](https://github.com/raiment-studios/monorepo#changelog) [![](https://img.shields.io/badge/discussions-welcome!-489)](https://github.com/raiment-studios/monorepo/discussions) [![](https://img.shields.io/badge/chat-zulip-386)](https://raiment-studios.zulipchat.com/)

## What is the Raiment?

**Raiment is a procedural, open world game: think Daggerfall set in a voxel-based world. It is designed specifically to be equally enjoyable to play as it is to contribute to.**

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
    -   Release 0: [Storytelling](source/projects/storytelling) - computer-aided "pen & paper" storytelling procedural rpg ([demo](https://storytelling.raiment.studio/))
    -   Release 1: [Graham's Quest](source/projects/adventure/01-grahams-quest/) - a simple 2D implementation
    -   Release 1b: TBD - a single-region, "snow globe" voxel-based world
    -   Release 2: [Rivia](source/projects/adventure/02-rivia/) - a 2.5D/3D voxel-based world
    -   Release 3: [Jaskier's Tale](source/projects/adventure/03-jaskiers-tale/) - a fully dynamic 3D voxel-based world
    -   Release 4: [Morgan Danes](source/projects/adventure/04-morgan-danes/) - distributed, multiplayer multiverse
-   **Libraries**
    -   [**Core**](source/lib/core) - general utilities used across projects
    -   [**Engine**](source/lib/engine) - the game engine tailored to Raiment's voxel world
    -   [**React-Ex**](source/lib/react-ex) - React utilities & extensions used across projects
-   [**Sea**](source/projects/sea) - a opinionated mix of intertwined development & productivity tools
    -   [**sea-jsx**](source/projects/sea/apps/sea-jsx) - app for quickly prototyping React Components
    -   [**sea-jest**](source/projects/sea/apps/sea-jest) - wrapper on Jest to avoid config file clutter
    -   [**sea-todo**](source/projects/sea/apps/sea-todo) - example todo web app ([demo](https://todo.raiment.studio/))
    -   [**sea-raytracer**](source/projects/sea/apps/sea-raytracer) - example application
-   [**Website**](source/projects/website) - the [public website](https://raiment-studios.github.io/) and material designed to encourage participation

## Technology / Architecture

The project is currently coded primarily in `JavaScript` in order to rapidly flesh out the first prototypes of the project and ensure they are easily accesible on the web. After the initial prototyping stabilizes, the project intends to migrate towards a `Rust` and `JavaScript` mix, utilizing `WASM` when appropriate.

See [tools](source/projects/organization/tools.md) for more details.

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

#### TODO (next)

-   [ ] 📚 Improve game design doc for adventure project
-   [ ] ➕ sea-jsx: `--target` for local files for build
-   [ ] ➕ Terrain example for engine

#### 2022.05

-   Week 20
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
    -   [x] 📣 sea-todo publishes to todo.raiment.studio

#### 2022.04

-   Week 17
    -   [x] 🗃️ Simplify publishing npm packages (using Codespace secrets)
    -   [x] 📚 Created CHANGELOG.md
    -   [x] 🛠️ Fix automated builds to workaround package-lock.json not liking tgz changes
    -   [x] 🗃️ Organize / improve sea-todo database code
    -   [x] ➕ Add sea-jsx watch/refresh on all referenced user files
    -   [x] ➕ Add EventEmitter to @raiment/core
-   Week 1-16
    -   [_Prehistory_](https://en.wikipedia.org/wiki/Prehistory)
