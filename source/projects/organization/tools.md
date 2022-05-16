# Tools

## Supported tools

<table>
    <tr>
        <td>3D modeling</td>
        <td>
            <div>Blender</div>
        </td>
    </tr>
    <tr>
        <td>2D art</td>
        <td>
            <div>Krita</div>
        </td>
    </tr>
    <tr>
        <td>Front-end programming</td>
        <td>
            <div>JavaScript</div>            
            <div>React</div>
            <div>Rust + WASM</div>
        </td>
    </tr>
    <tr>
        <td>Backend programming</td>
        <td>
            <div>Rust</div>
        </td>
    </tr>
    <tr>
        <td>Build tooling</td>
        <td>
            <div>Make</div>            
            <div>Bash</div>
        </td>
    </tr>    
    <tr>
        <td>Deployment</td>
        <td>
            <div>Firebase</div>            
        </td>
    </tr>    
    <tr>
        <td>Code editor</td>
        <td>
            <div>Visual Studio Code</div>
            <div>Codespaces</div>            
        </td>
    </tr>
    <tr>
        <td>Documentation</td>
        <td>
            <div>Markdown</div>            
            <div>YAML</div>
        </td>
    </tr>
    <tr>
        <td>Screen capture</td>
        <td>
            <div><a href="https://www.flashbackrecorder.com/express/">FlashBack Express</a></div>
        </td>
    </tr>
</table>


## Custom tools

Adopt the Unix approach and write small, single purpose command-line tools.  Do this rather than complex command-line tools that maintain a lot of state. For user convenience, _wrapping_ multiple tools into a single facade (this is how [`sea`](/source/projects/sea) is designed) is a good solution to get the advantages of both user convenience and separation of concerns.