# Raiment Studios monorepo

![](https://img.shields.io/badge/license-MIT-039) ![unit tests](https://github.com/raiment-studios/monorepo/actions/workflows/unit-test.yml/badge.svg) ![GitHub commit activity](https://img.shields.io/github/commit-activity/w/raiment-studios/monorepo) ![GitHub last commit](https://img.shields.io/github/last-commit/raiment-studios/monorepo) [![](https://img.shields.io/badge/dev-CHANGELOG-14D)](https://github.com/raiment-studios/monorepo#changelog) [![](https://img.shields.io/badge/discussions-welcome!-489)](https://github.com/raiment-studios/monorepo/discussions) [![](https://img.shields.io/badge/chat-zulip-386)](https://raiment-studios.zulipchat.com/)

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
-   [**Adventure**](source/projects/adventure) - voxel-based, open-world adventure rpg
    -   Milestone 1: [Graham's Quest](https://grahams-quest.raiment.studio/) - a simple 2D implementation
    -   Milestone 2: Rivia - a 2.5D/3D voxel-based world
    -   Milestone 3: Jaskier's Tale - a fully dynamic 3D voxel-based world
    -   Milestone 4: Name TBD - multiplayer
-   [**Storytelling**](source/projects/storytelling) - computer-aided "pen & paper" solo storytelling procedural rpg ([demo](https://storytelling.raiment.studio/))
-   **Libraries**
    -   [**Core**](source/lib/core) - general utilities used across projects
    -   [**Engine**](source/lib/engine) - the game engine tailored to Raiment's voxel world
    -   [**React-Ex**](source/lib/react-ex) - React utilities & extensions used across projects
-   [**Sea**](source/projects/sea) - a opinionated mix of compiler, wiki, CMS, and project manager
    -   [**sea-jsx**](source/projects/sea/apps/sea-jsx) - app for quickly prototyping React Components
    -   [**sea-jest**](source/projects/sea/apps/sea-jest) - wrapper on Jest to avoid config file clutter
    -   [**sea-todo**](source/projects/sea/apps/sea-todo) - example todo web app ([demo](https://todo.raiment.studio/))
    -   [**sea-raytracer**](source/projects/sea/apps/sea-raytracer) - example application
-   **Marketing** - the public website and material designed to encourage participation

## Technology

The project is currently coded primarily in `JavaScript` in order to rapidly flesh out the first prototypes of the project and ensure they are easily accesible on the web. After the initial prototyping stabilizes, the project intends to migrate towards a `Rust` and `JavaScript` mix, utilizing `WASM` when appropriate.

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

Unless stated explicitly otherwise, any contribution intentionally submitted for inclusion in this repository or otherwise to the project shall be licensed as stated above without any additional terms or conditions.

## CHANGELOG

➕ new or improved functionality, 🗃️ internal organization or code improvements, 🛠️ defect fix, 📣 publication or release

#### TODO (next)

-   [ ] 🗃️ Remove npm tgz packaging build and file:// references from projects
-   [ ] 🗃️ Organize sea-todo files
-   [ ] ➕ sea-jsx: reload the main Component on changes without session reset

#### 2022.05.06

-   [x] ➕ Add "remember last file" to sea-todo

#### 2022.05.04

-   [x] ➕ `sea-jsx --build` now creates a single index.html with inlined JS

#### 2022.05.02

-   [x] 📣 sea-todo publishes to todo.raiment.studio

#### 2022.04.26

-   [x] 🗃️ Simplify publishing npm packages (using Codespace secrets)
-   [x] 📚 Created CHANGELOG.md

#### 2022.04.25

-   [x] 🛠️ Fix automated builds to workaround package-lock.json not liking tgz changes
-   [x] 🗃️ Organize / improve sea-todo database code
-   [x] ➕ Add sea-jsx watch/refresh on all referenced user files
-   [x] ➕ Add EventEmitter to @raiment/core
