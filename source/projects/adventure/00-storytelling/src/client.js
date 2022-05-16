import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './app';

ReactDOM.render(
    <>
        <DevelopmentReloader />
        <App />
    </>,
    document.getElementById('client')
);

function DevelopmentReloader() {
    if (DEVELOPMENT_MODE) {
        console.log('Running development build');
        React.useEffect(() => {
            let value = {
                last: null,
            };
            let timer = setInterval(async () => {
                const resp = await fetch('/buildstamp.txt');
                const text = await resp.text();
                if (value.last === null) {
                    value.last = text;
                } else if (value.last !== text) {
                    window.location.reload();
                }
            }, 3000);
            return () => {
                clearInterval(timer);
            };
        }, []);
    } else {
        console.log('Running production build');
    }
    return null;
}
