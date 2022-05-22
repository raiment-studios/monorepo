# Contributing

**⚠️ Warning: this project is not yet ready for contributions as more groundwork needs to be done to make it easy to participate.**

[![](https://img.shields.io/badge/feedback-welcome!-1a1)](https://github.com/raiment-studios/monorepo/discussions)



<!-- TOC -->

- [Contributing](#contributing)
    - [Intellectual property, copyright, and legal matters](#intellectual-property-copyright-and-legal-matters)
    - [Supported environment](#supported-environment)
    - [Directory structure](#directory-structure)
    - [Development process](#development-process)
    - [Type of contributions](#type-of-contributions)
        - [Content](#content)
        - [Refinements](#refinements)
        - [Features](#features)
        - [Gardening](#gardening)

<!-- /TOC -->

## Intellectual property, copyright, and legal matters

⚖️ TODO

## Supported environment

The supported workflow is to use GitHub Codespaces so that there is a normalized, easy to replicate development environment. The development environment is in a Ubuntu-based container as defined by the devcontainer [`Dockerfile`](../../../.devcontainer/Dockerfile). The devcontainer set up also ensures any common settings and plugins are unified across developers. Contributors are highly enouraged to use this approach to minimize setup discrepancies.

## Directory structure

The project uses a ["monorepo"](https://en.wikipedia.org/wiki/Monorepo) approach to development.

* `deploy` - files related to publishing & deploying
* `source`
    * `projects` - main, continually developed projects
    * `lib` - reusable libraries of code
    * `sandbox` - prototypes, experiments, and one-off code

## Development process

🚧 TODO

## Type of contributions

### Content

In this context, "content" is defined as adding another instance of something that already exists in the project.  A content contribution might be a new item type in the game or a new character backstory in the worldbuilding.  This contrasts from a "feature" where a feature might be a new _type of_ item or character. There will be a blurry line between a feature and content at times, but in general, content is a new variation of a common pattern whereas a feature has some introduces some novel aspect that is unique to the project.

### Refinements

Small modifications to existing content or functionality that better aligns it to project goals.  This includes bug fixes and content corrections.

### Features

New functionality that does not have a parallel in the project.

### Gardening

Minor changes to ensure consistent structure across the project.  Fixing typoes, style inconsistencies, etc.  By definition, these should be uncontroversial changes - and often the type that ideally could be automated!