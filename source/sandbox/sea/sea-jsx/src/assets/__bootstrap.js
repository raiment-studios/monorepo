import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './__app.js';

const container = document.getElementById('client');
const root = ReactDOM.createRoot(container);

root.render(
    <>
        <ContentPoll url="/cache-id" onChange={() => window.location.reload()} />
        <App />
    </>
);

function ContentPoll({ url, onChange }) {
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
    return null;
}
