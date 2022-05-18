import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './__app.js';

/**
 * ErrorBoundary will catch any rendering exception in the custom component
 * so that the custom component does not crash the core application.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
        };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error(error, errorInfo);
    }

    render() {
        const { error } = this.state;
        if (error) {
            return (
                <div
                    style={{
                        margin: 20,
                        padding: 20,
                        border: 'solid 2px red',
                        borderRadius: 6,
                    }}
                >
                    <h2>
                        <code>{`${error}`}</code>
                    </h2>
                    <h3>See console for details</h3>
                    <div>
                        {error.stack.split('\n').map((s) => (
                            <pre style={{ margin: '2px 0' }}>
                                <code>{s.replace(window.location, '')}</code>
                            </pre>
                        ))}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

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

const container = document.getElementById('client');
const root = ReactDOM.createRoot(container);

root.render(
    <>
        <ContentPoll url="/cache-id" onChange={() => window.location.reload()} />
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    </>
);
