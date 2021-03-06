import React from 'react';
import { Flex } from '@raiment/react-ex';

export function EngineRecorder({
    engine,
    rendererName = 'three',
    duration = 16600,
    autoStart = false,
}) {
    const [recording, setRecording] = React.useState({
        active: false,
        ready: false,
        dataURI: null,
        countdown: 0,
    });

    function recordCanvasToBlob(canvas, ms) {
        return new Promise((resolve) => {
            const stream = canvas.captureStream(60);
            const mediaRecorder = new MediaRecorder(stream, {
                videoBitsPerSecond: 5 * 8 * 1000 * 1000,
                mimeType: 'video/webm;codecs=vp9',
            });

            let recordedChunks = [];
            mediaRecorder.ondataavailable = function (evt) {
                if (evt.data.size > 0) {
                    recordedChunks.push(evt.data);
                }
            };
            mediaRecorder.onstop = function () {
                var blob = new Blob(recordedChunks, {
                    type: 'video/webm;codecs=vp9',
                });
                let url = URL.createObjectURL(blob);
                resolve(url);
            };
            mediaRecorder.start(0);
            setTimeout(() => mediaRecorder.stop(), ms);
        });
    }

    const handleRecord = async (duration) => {
        const start = Date.now();

        setRecording({ active: true, ready: false, dataURI: null, countdown: duration });

        let timer = setInterval(() => {
            const ellapsed = Date.now() - start;
            const remaining = Math.max(0, duration - ellapsed);
            setRecording((r) => ({ ...r, countdown: remaining }));
        }, 500);

        const canvas = engine.renderers[rendererName].canvas;
        const dataURI = await recordCanvasToBlob(canvas, duration);
        clearInterval(timer);
        setRecording({
            active: false,
            ready: true,
            dataURI,
        });
    };

    React.useEffect(() => {
        if (autoStart) {
            setTimeout(() => handleRecord(), 100);
        }
    }, []);

    return (
        <div>
            <Flex
                style={{
                    padding: '4px 0',
                }}
            >
                <button
                    style={{
                        width: '8rem',
                    }}
                    disabled={recording.active}
                    onClick={() => handleRecord(duration)}
                >
                    {recording.active
                        ? `Recording (${Math.floor(recording.countdown / 1000)})...`
                        : 'Record'}
                </button>
                <div style={{ width: '.25rem' }} />
                <button disabled={recording.active} onClick={() => handleRecord(8000)}>
                    8
                </button>
                <div style={{ width: '.25rem' }} />
                <button disabled={recording.active} onClick={() => handleRecord(12000)}>
                    12
                </button>
                <div style={{ width: '.25rem' }} />
                <button disabled={recording.active} onClick={() => handleRecord(30000)}>
                    30
                </button>
                <div style={{ width: '.25rem' }} />
                <button disabled={recording.active} onClick={() => handleRecord(60000)}>
                    60
                </button>
                <div style={{ width: '1rem' }} />
                <div>
                    {recording.ready && (
                        <a href={recording.dataURI} target="_blank">
                            download
                        </a>
                    )}
                </div>
            </Flex>
        </div>
    );
}
