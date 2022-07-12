// Import our outputted wasm ES6 module
// Which, export default's, an initialization function
import init from './pkg/hello_world.js';

const runWasm = async () => {
    // Instantiate our wasm module
    const helloWorld = await init('./pkg/hello_world_bg.wasm');

    const result = await helloWorld.main();

    // Set the result onto the body
    //document.body.textContent = `Hello World?`;
};
runWasm();
