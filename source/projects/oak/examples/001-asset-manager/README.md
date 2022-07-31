# Oak: Asset Manager

A repository of assets for the world of Kestrel / Galthea / Raiment.

Unlike opengameart, the assets are all intended to fit same worldbuilding.

Resources are stored in git in the following pattern in git:

```
assets/
    <pack>/<type>/<subtype*>/
        <id>.meta.yaml
        <id>.<ext>
        <id>.<prop>.<ext>
```

The standard resource type in memory is:

```
meta:
    id      : string
    uuid    : string?
    pack    : string
    type    : string-with-separators
    schema  : string?
    version : semantic-version-string
    tags    : []string
    license : string?
    author  : string?
    status  : "placeholder" | "draft" | "published"
    labels  : key-value pairs
content:
    object, buffer, text
properties:
    <propname>*  : object | buffer | text
```

Example types of assets:

-   color palettes
-   tiles
-   sound effects
