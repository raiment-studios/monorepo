import React from 'react';
import * as ReactEx from '../../../react-ex';
import { StateMachine } from '../..';

const start = Date.now();

export default function () {
    const [log, setLog] = React.useState([]);

    const append = (s) => {
        const ts = Math.floor((Date.now() - start) / 1000);
        setLog((log) => [...log, `${`${ts}`.padStart(3, '0')} ${s}`]);
    };

    React.useEffect(() => {
        append('Starting...');

        const sm = new StateMachine({
            _start: function* () {
                append('start state');
                return 'count';
            },
            count: function* () {
                for (let i = 0; i < 6; i++) {
                    append(`count = ${i}`);
                    yield i * 2;
                }
                return ['echo', 'the end'];
            },
            echo: function* (s) {
                append(s);
            },
        });

        const timer = setInterval(() => {
            sm.update();
        }, 100);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return (
        <ReactEx.ReadingFrame>
            <h1>State Machine</h1>
            <pre>{log.join('\n')}</pre>
        </ReactEx.ReadingFrame>
    );
}
