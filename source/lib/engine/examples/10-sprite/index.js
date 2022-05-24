import React from 'react';
import { ReadingFrame, useAsyncEffect } from '@raiment/react-ex';
import { useEngine, EngineFrame, Grid, OrbitCamera, BasicLighting } from '../../';
import assets from 'glob:**/*{.png,.asset.yaml}';

const assetsURL = Object.fromEntries(assets.matches.map(({ url }) => [url, url]));

export default function () {
    const [data, setData] = React.useState('');
    useAsyncEffect(async (token) => {
        const resp = await fetch(assetsURL['kestrel.png.asset.yaml']);
        const text = await resp.text();
        token.check();
        setData(text);
    }, []);

    return (
        <ReadingFrame>
            <h1>Sprite</h1>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                <div style={{ flex: '1 0 0' }} />
                <Img src={assetsURL['kestrel.png']} />
                <div style={{ flex: '1 0 0' }} />
            </div>
            <div style={{ margin: '6px 0' }}>
                <EngineView />
            </div>
            <div>
                <pre>{JSON.stringify(assetsURL, null, 4)}</pre>
            </div>
            <div>
                <pre>{data}</pre>
            </div>
        </ReadingFrame>
    );
}

function EngineView() {
    const engine = useEngine(() => {
        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 96 }), //
            new BasicLighting()
        );
    });

    console.log(engine.uuid);

    return <EngineFrame engine={engine} />;
}

function Img({ src, scale = 6 }) {
    const [image, setImage] = React.useState(null);

    useAsyncEffect(async (token) => {
        const img = new Image();
        img.onload = () => {
            if (!token.active) {
                return;
            }
            setImage(img);
        };
        img.src = src;
    }, []);

    return (
        image && (
            <img
                style={{
                    width: image.width * scale,
                    height: image.height * scale,
                    imageRendering: 'pixelated',
                }}
                src={image.src}
            />
        )
    );
}
