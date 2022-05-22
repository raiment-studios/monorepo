# Contributing

**⚠️ Warning: this project is not yet ready for contributions as more groundwork needs to be done to make it easy to participate.**

[![](https://img.shields.io/badge/feedback-welcome!-1a1)](https://github.com/raiment-studios/monorepo/discussions)

<!-- TOC -->

- [Contributing](#contributing)
    - [Intellectual property, copyright, and legal matters](#intellectual-property-copyright-and-legal-matters)
    - [Supported coding environment](#supported-coding-environment)
    - [Directory structure](#directory-structure)
    - [Development process](#development-process)
    - [Communication conventions](#communication-conventions)
        - [Emoji conventions](#emoji-conventions)
        - [Badge conventions](#badge-conventions)
    - [Type of contributions](#type-of-contributions)
        - [Content](#content)
        - [Refinements](#refinements)
        - [Features](#features)
        - [Gardening](#gardening)

<!-- /TOC -->

## Intellectual property, copyright, and legal matters

⚖️ TODO

## Supported coding environment

The supported workflow is to use GitHub Codespaces so that there is a normalized, easy to replicate development environment. The development environment is in a Ubuntu-based container as defined by the devcontainer [`Dockerfile`](../../../.devcontainer/Dockerfile). The devcontainer set up also ensures any common settings and plugins are unified across developers. Contributors are highly enouraged to use this approach to minimize setup discrepancies.

## Directory structure

The project uses a ["monorepo"](https://en.wikipedia.org/wiki/Monorepo) approach to development.  [Git LFS](https://git-lfs.github.com/) is used as the storage mechanism for large and/or binary assets.

* `deploy` - files related to publishing & deploying
* `source`
    * `projects` - main, continually developed projects
    * `lib` - reusable libraries of code
    * `sandbox` - prototypes, experiments, and one-off code

## Development process

🚧 TODO

## Communication conventions

### Emoji conventions

Emojis are used as visual symbols in the project. As symbols, they can help convey a common idea quickly - if that symbol has a meaning that's defined and used consistently!

* 💡 Idea or thought
* ⚠️ Warning
* 🚫 Avoid
* 🐉 Danger!
* 🚧 TODO
* 📣 Publication or release
* 📚 Documentation, tutorials, or guides
* ➕ New or improved functionality
* 🧬 Experiments and sandboxes
* 🛠️ Defect fix
* 🗃️ Internal organization, code improvements, or architecture
* ⚖️ Legal matter
* 🦕 Historical matter

### Badge conventions

**_🚧 TODO: determine if these are used enough to require conventions_**

| Badge | Code |
| ----- | ---- |
| ![](https://img.shields.io/badge/status-placeholder-c00) | `![](https://img.shields.io/badge/status-placeholder-c00)` |
| ![](https://img.shields.io/badge/status-draft-930) | `![](https://img.shields.io/badge/status-draft-930)` |
| ![](https://img.shields.io/badge/status-ready-797) | `![](https://img.shields.io/badge/status-ready-797)` |
| ![](https://img.shields.io/badge/version-v0.1.0-079) | `![](https://img.shields.io/badge/version-v0.1.0-079)` |
| [![](https://img.shields.io/badge/feedback-welcome-1a7)](https://github.com/raiment-studios/monorepo/discussions)  | `[![](https://img.shields.io/badge/feedback-welcome-1a7)](https://github.com/raiment-studios/monorepo/discussions)` |




## Type of contributions

### Content

In this context, "content" is defined as adding another instance of something that already exists in the project.  A content contribution might be a new item type in the game or a new character backstory in the worldbuilding.  This contrasts from a "feature" where a feature might be a new _type of_ item or character. There will be a blurry line between a feature and content at times, but in general, content is a new variation of a common pattern whereas a feature has some introduces some novel aspect that is unique to the project.

### Refinements

Small modifications to existing content or functionality that better aligns it to project goals.  This includes bug fixes and content corrections.

### Features

New functionality that does not have a parallel in the project.

### Gardening

Minor changes to ensure consistent structure across the project.  Fixing typoes, style inconsistencies, etc.  By definition, these should be uncontroversial changes - and often the type that ideally could be automated!