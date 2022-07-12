// The wasm-pack uses wasm-bindgen to build and generate JavaScript binding file.
// Import the wasm-bindgen crate.
use wasm_bindgen::prelude::*;

// Our Add function
// wasm-pack requires "exported" functions
// to include #[wasm_bindgen]
#[wasm_bindgen]
pub fn main() {
    // Use `web_sys`'s global `window` function to get a handle on the global
    // window object.
    let window = web_sys::window().expect("no global `window` exists");
    let document = window.document().expect("should have a document on window");

    document.set_title("sea-rustwasm example");

    let body = document.body().expect("document should have a body");

    // Manufacture the element we're gonna append
    let val = document.create_element("h1").expect("should always work");
    val.set_text_content(Some("Hello from Rust!"));

    body.append_child(&val).expect("oh no!");
}
