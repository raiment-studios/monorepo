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


## Ideas

Sea is about deploying a system. A system is composed of 1 or more resources. resources can be dynamic programs or static assets. These run on nodes. Resources and instances of resources are named.

Context includes: the node id, instance id, resource id, thread id, transaction id.

Resources are compoesd of named symbols. Some are exported.

What does resource lifetime mean? What's the lifetime of static content.  Deployed resources are accessible somehow. A PNG would have some URI. Everything is executed upon retreival.

Publicly exported versus exported within the system versus exported within the resource.  Anything publicly exposed in the system gets a URL. Single domain + sub-domain (??).

How does a single-page webapp work where different URLs should represent different views within the same program? Should Sea enforce that unique URLs refer to unique resources? (The portion of the app being used could easily be expressed as the hash.)  A single-page webapp is essentially a single stateful core with a number of different exported resource views.


```
// main/main.sea
public function main() -> string {
    return "Hello, world!";
}
```

```
system {
    server main {
        // how many instances?
        // where is it accessible?
        // what determines if it's a web asset vs. CLI?
    }
}
```

```yaml
type: raiment/react-webapp
host: 
    platform: raiment/browser-normalized    
```

Visiting a URL is equivalent to running a command on the command-line.  QUery arguments are equivalent to command-line arguments. 

To implement this, a leader WSP might exist that provides the normalized HTML enviroment and does routing. This could allow for centralized management of the browser resources. 

How is a session-length resource created and maintained? How is it reset? Could visit another resource with a create-or-get semantic.  Or perhaps it is a connect-or-run semantic?  Conceptually there are services. There's an implicit init() function and a end-points that can be called whenever it is live.  From this view a website could be a root service and each page an endpoint.  The service runs until a certain timeout?


### Nodes

Sea "services" are nodes. They are composed of the following:

- 0 or more named & typed inputs
- 0 or more named & typed outputs
- Has internal state
- Can emit and repond to events

The nodes outputs are reevaluated when the value of an inputs or the internal state changes. [Aside: variant (JSON-ish) is a valid type to keep these easy to prototype.]


```
node multiply (
    op1 : number,
    op2 : number
) -> (
    result : number 
) {
    op1 * op2
}
```

This is good for evaluating a graph, but how would a todo app work? Can nodes have persisted internal state?

```
node TodoDatabase {
    inputs {}
    state {
        list string[]
    }
    actions {
        add(s string) {
            // "state" is a reserved word
            // a mutation of a state value automatically 
            state.list.append(s);
        }
    }
    outputs {
        list -> string[] {
            return state.list
        }

        // Note this will only get reevaluated when the underlying state
        // or incoming inputs change
        select (query? string) -> string[] {
            // compute results of query
            return results
        }
    }
}

node TodoListView {
    inputs {
        list : string[]
    }
    outputs {
        view -> JSX {
            <div>
                {inputs.list.map((item) => (
                    <div>{item}</div>
                ))}
            </div>
        }
    }

}

node TodoApp {
    type: jsx
    inputs: {
        persistence 
    }
    nodes: {
        database : TodoDatabase{}[
            state : inputs.persistance
        ],
        view : TodoListView { list : nodes.database }
    }
    outputs: {
        value JSX : view.outputs.view
    }
}

deployment Remote {
    host : {
        type : browser
        root : self.nodes.app
    }
    nodes : {
        app : TodoApp{
            persistence : LocalStorage,
        }
    }
}
```

```
Algorithm: 
    - Init
        - To create a node
            - First evaluate any inputs (checking for recursion)
        - Create node
        - Evaluate
    - Update
        - Event causes a state change
        - Need inverse mapping of outputs -> inputs
        - For each mapped output (which may depend on other evals), compute & recompute mapped to node
```
