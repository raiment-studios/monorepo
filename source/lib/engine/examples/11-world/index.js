import React from 'react';
import { ReadingFrame, useAsyncEffect, Flex } from '../../../react-ex';
import { parseYAML } from '../../../core';
import {
    useEngine,
    EngineFrame,
    Grid,
    OrbitCamera,
    BasicLighting,
    GroundPlane,
    loadImage,
    VoxelSprite,
} from '../..';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/proto/**/*{.png,.asset.yaml}';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    const [data, setData] = React.useState('');
    useAsyncEffect(async (token) => {
        const resp = await fetch(assetURL['kestrel.png.asset.yaml']);
        const text = await resp.text();
        token.check();
        setData(parseYAML(text));
    }, []);

    console.log(assetURL);

    return (
        <ReadingFrame>
            <h1>VoxelSprite</h1>

            <div style={{ margin: '6px 0' }}>
                <EngineView />
            </div>
            <Flex dir="row">
                <div style={{ flex: '1 0 0' }} />
                <PixelatedImage src={assetURL['kestrel.png']} />
                <div style={{ flex: '1 0 0' }} />
                <div>
                    <h3>Image license</h3>
                    <pre>{textToReact(data.license)}</pre>
                </div>
            </Flex>
        </ReadingFrame>
    );
}

function EngineView() {
    const engine = useEngine(() => {
        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 12, periodMS: 9000 }), //
            new BasicLighting(),
            new GroundPlane(),
            new VoxelSprite({ url: assetURL['kestrel.png'] })
        );
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

function PixelatedImage({ src, scale = 6 }) {
    const [image, setImage] = React.useState(null);

    useAsyncEffect(async (token) => {
        const img = await loadImage(src);
        token.check();
        setImage(img);
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

function textToReact(s) {
    if (!s) {
        return null;
    }

    const expression =
        /(https?:\/\/)[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)?/i;

    const re = new RegExp(expression);

    const parts = [];
    let t = s;
    while (t.length > 0) {
        const m = re.exec(t);
        if (!m || !(m.index >= 0)) {
            break;
        }
        const pre = t.substring(0, m.index);
        const match = m[0];
        const post = t.substring(m.index + match.length);

        const url = match.match(/^[a-z]+:\/\//) ? match : `https://${match}`;

        parts.push(
            <span>{pre}</span>, //
            <a href={url} target="_blank">
                {match}
            </a>
        );
        t = post;
    }
    if (t.length > 0) {
        parts.push(<span>{t}</span>);
    }

    return <>{parts}</>;
}
