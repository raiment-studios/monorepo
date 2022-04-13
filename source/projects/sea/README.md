# Sea

At the moment, Sea is a loosely formed idea that needs more definition...

The overall goal is to produce a tool that makes working on Raiment simple, consistent, and easy. It should focus on:

-   Encouraging incremental, iterative development
-   Ensuring consistency of conventions
-   Allowing content as well as code contributions & refinements

What this may mean...

-   A build tool
-   A code sandbox
-   A static site generator
-   A content management system
-   A wiki
-   A project manager
-   A deployment tool

A build tool that hides all the complexity of distributed systems tooling, from Terraform to eslint to WASM to Kubernetes to CRUD. In practice, Sea may end up being a front-end to encapsulate the tooling and options on many of these other tools: thus trading some of their flexibility for simplicity by conforming the tools to specifics for the Raiment project.

A programming language similar to Rust but with first-class support for a garbage-collected variant type.

A wiki for self-documenting code & ideas that allows incremental development from idea to working services.

Supports running locally, running remotely, running a combination of local & remote. Supports hot-reloading and fast rebuilds.

Separation of data from interfaces for manipulating, accessing, and viewing that data.

---

## ⛈️ Use case brainstorming ⛈️

-   [ ] Root directory _should not_ have 15 config files for different tools
-   [ ] Source file only projects with single target config file
-   [ ] Update README with table of contents
-   [ ] Check Markdown files for broken links
-   [ ] Similar to Obsidian Dataview plug-in


# Project

Project is a lightweight project management tool.

It is _opinionated_ as, fully general project management tools often can either introduce too much abstraction (putting too much focus on the process rather than the goals) or require extensive administration.

It uses this data model heirarchy:

* Users belong to 0 or more Organizations
* Each Organization has 0 or more Projects
* Projects have 0 or more Epics
    * Releases are large functioality checkpoints  (ideally 1-12 Milestones)
    * Milestones are engineering checkpoints within an Epic (ideally 4-6 weeks)
    * Tasks are logical steps (ideally 30 mins to 2 days of work)
    * Todos are small pieces of a task (ideally 0-10 per task)
* Projects also have a Backlog for loosely categorized items
* The project database is stored as user-editable Markdown and YAML, making them directly editable and maanageable via source control

## Milestones

### Milestone 1: Soloist

A todoist-like clone except it is designed (1) for a single user, (2) the data is stored in a YAML file for git storage, and (3) improved filtering.

Task data model

- name
- uid
- id
- tags (keys and key-values)
- status (idea, todo, wip, done)
- markdown description
