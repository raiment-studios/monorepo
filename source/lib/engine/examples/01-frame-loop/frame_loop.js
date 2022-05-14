import React from 'react';
import { FrameLoop } from '../..';

export default function () {
    const [frameData, setFrameData] = React.useState({
        frameNumber: 0,
    });
    React.useEffect(() => {
        let frameLoop = new FrameLoop(
            (ctx) => {
                setFrameData({
                    frameNumber: ctx.frameNumber,
                    frameSkipCount: ctx.frameSkipCount,
                    frameLoopTimeMS: ctx.frameLoopTimeMS,
                    frameTimeMS: ctx.frameTimeMS,
                });
            },
            {
                maxFPS: 30,
            }
        );
        frameLoop.start();
        console.log(frameLoop);
        return () => {
            frameLoop.stop();
        };
    }, []);

    return (
        <div
            style={{
                margin: '1rem auto 6rem',
                width: '62rem',
            }}
        >
            <h1>Hello World!</h1>
            <div>
                <code>frameNumber: {frameData.frameNumber}</code>
            </div>
            <div>
                <code>frameSkipCount: {frameData.frameSkipCount}</code>
            </div>
            <div>
                <code>Loop time: {frameData.frameLoopTimeMs}</code>
            </div>
            <div>
                <code>
                    Average FPS:{' '}
                    {Math.floor((10000 * frameData.frameNumber) / frameData.frameLoopTimeMS) / 10}
                </code>
            </div>
            <div>
                <code>
                    Theoretical FPS:{' '}
                    {Math.floor((10000 * frameData.frameNumber) / frameData.frameTimeMS) / 10}
                </code>
            </div>
        </div>
    );
}
