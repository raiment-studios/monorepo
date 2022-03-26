import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './app';

ReactDOM.render(
    <>
        <ContentPoll url="/buildstamp.txt" onChange={() => window.location.reload()} />
        <App />
    </>,
    document.getElementById('client')
);

function ContentPoll({ url, onChange }) {
    if (DEVELOPMENT_MODE) {
        console.log('Running development build');
        React.useEffect(() => {
            let value = {
                last: null,
            };
            let timer = setInterval(async () => {
                const resp = await fetch(url);
                const text = await resp.text();
                if (value.last === null) {
                    value.last = text;
                } else if (value.last !== text) {
                    onChange();
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
