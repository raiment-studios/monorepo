import React from 'react';
import { ReadingFrame, useAsyncEffect } from '@raiment/react-ex';

export default function () {
    const [data, setData] = React.useState('');
    useAsyncEffect(async (token) => {
        const resp = await fetch('kestrel.png.asset.yaml');
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
                <Img src="kestrel.png" />
                <div style={{ flex: '1 0 0' }} />
            </div>
            <div>
                <pre>{data}</pre>
            </div>
        </ReadingFrame>
    );
}

function Img({ src, scale = 6 }) {
    const [image, setImage] = React.useState(null);

    useAsyncEffect(async (token) => {
        const img = new Image();
        img.onload = () => {
            if (!token.active) {
                return;
            }
            console.log(img, img.width, img.height, img.src);
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
