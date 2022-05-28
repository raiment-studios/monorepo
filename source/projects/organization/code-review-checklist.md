🚧 Page under construction

Whenever possible these process should be automated, but nonetheless they are also documented here.

<!-- TOC depthfrom:2 orderedlist:false withlinks:true bulletcharacter:1. -->

1. [Review](#review) 1. [Planning checklist](#planning-checklist) 1. [Review checklist](#review-checklist)
1. [Patterns](#patterns)
    1. [Separation of concerns](#separation-of-concerns)
        1. [Benefits](#benefits)
        1. [Trade-offs](#trade-offs)
    1. [Glue code](#glue-code)
    1. [Scaffolding code](#scaffolding-code)

<!-- /TOC -->

## Review

#### Planning checklist

-   [ ] Public API
    -   [ ] Versioning
    -   [ ] Backwards compatibility
    -   [ ] Deprecation plans
-   [ ] Configuration & Telemetry
    -   [ ] Feature flags
    -   [ ] User analytics
    -   [ ] Metrics & Traces
    -   [ ] Logs
-   [ ] Data / storage
    -   [ ] Data migrations
    -   [ ] Backwards compatibility
-   [ ] Performance / Scalability
    -   [ ] Benchmarks
    -   [ ] Load tests
-   [ ] Automation
    -   [ ] CI/CD
-   [ ] Testing
    -   [ ] Manual testing
    -   [ ] External validation
    -   [ ] Unit tests
    -   [ ] Integration tests
-   [ ] Release

#### Review checklist

-   Filenames
    -   Should be all lowercase for maximal system compatibility

## Patterns

### Separation of concerns

#### Benefits

-   Loose coupling of dependencies

#### Trade-offs

-   Extensive configuration and set up
-   Parameterization allows for invalid states
-   Paramaterization creates implementation complexity due to many potential states

### Glue code

### Scaffolding code
