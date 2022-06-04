import React from 'react';
import { useAsyncEffect } from '../hooks/use_async_effect';

export function PixelatedImage({ src, scale = 6, onClick }) {
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
                onClick={onClick}
            />
        )
    );
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => {
            console.error(err);
            reject(err);
        };
        img.src = src;
    });
}
