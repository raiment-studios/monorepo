import React from 'react';
import * as ReactEx from '@raiment/react-ex';
import * as core from '@raiment/core';
import * as fs from './__runtime/fs';
import 'serve:data.yaml';

export default function () {
    const [data, setData] = React.useState(null);

    ReactEx.useAsyncEffect(async (token) => {
        const resp = await fetch('data.yaml');
        const text = await resp.text();
        const obj = core.parseYAML(text);
        console.log(obj);
        token.check();
        setData(obj);
    }, []);

    const handleClick = async (evt) => {
        evt.preventDefault();
        data.count++;
        setData({ ...data });
        await fs.writeFile('data.yaml', core.stringifyYAML(data));
    };

    return (
        data && (
            <ReactEx.ReadingFrame>
                <h1>Hello World</h1>
                <div>Count: {data.count} </div>
                <button onClick={handleClick}>Add 1</button>
            </ReactEx.ReadingFrame>
        )
    );
}
