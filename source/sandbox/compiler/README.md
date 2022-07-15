### Definition of done

-   [ ] Interpreter mode
-   [ ] Build to WASM
-   [ ] Build to JS/TS
-   [ ] Build to binary (using Rust)

### Specification

Going to keep it simple:

-   "platform" imported automatically
-   TypeScript-like syntax
-   Basic types only.

```
function main() {
    platform.println("Hello world!", add(37, 5));
}

function add(a : float32, b : float32) : float32 {
    return a + b;
}
```

Needs some connection to the external platform for any user interaction
