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
