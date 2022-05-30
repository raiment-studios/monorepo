import React from 'react';
import ReactDOM from 'react-dom/client';

export class RendererReact {
    //-----------------------------------------------------------------------//
    // Construction
    //-----------------------------------------------------------------------//

    constructor(hostElement, engine) {
        const rect = hostElement.getBoundingClientRect();
        const { width, height } = rect;

        hostElement.style.position = 'relative';

        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.width = `${width}px`;
        container.style.height = `${height}px`;
        container.style.top = 0;
        container.style.left = 0;
        container.style.backgroundColor = 'transparent';
        container.style.overflow = 'clipped';
        hostElement.appendChild(container);

        this._container = container;

        const root = ReactDOM.createRoot(container);
        root.render(<Container engine={engine} width={width} height={height} />);
    }

    dispose() {}

    //-----------------------------------------------------------------------//
    // Properties
    //-----------------------------------------------------------------------//

    //-----------------------------------------------------------------------//
    // Methods
    //-----------------------------------------------------------------------//
}

let local = {
    uniqueID: 1,
};

function Container({ engine, width, height }) {
    const [messages, setMessages] = React.useState([]);

    const handleDispose = (id) => {
        setMessages((messages) => messages.filter((c) => c.id !== id));
    };

    React.useEffect(() => {
        const unwind = engine.events.on('journal.message', (msg) => {
            setMessages((messages) => [
                ...messages,
                {
                    id: local.uniqueID++,
                    content: msg,
                },
            ]);
        });
        return () => {
            unwind();
        };
    }, []);

    return (
        <div
            style={{
                boxSizing: 'border-box',
                width,
                height,
                color: 'white',
                padding: 8,
                overflow: 'hidden',
                userSelect: 'none',
            }}
        >
            {messages.map((c) => (
                <JournalMessage key={c.id} msg={c.content} onDispose={() => handleDispose(c.id)} />
            ))}
        </div>
    );
}

function JournalMessage({ msg, onDispose }) {
    const ref = React.useRef(null);
    const [style, setStyle] = React.useState({
        opacity: 0,
        height: 'auto',
        padding: 8,
        marginBottom: 4,
    });

    React.useEffect(() => {
        const timers = [
            setTimeout(() => setStyle((style) => ({ ...style, opacity: 1 })), 0),
            setTimeout(() => {
                const rect = ref.current.getBoundingClientRect();
                setStyle((style) => ({ ...style, height: rect.height }));
            }),
            setTimeout(() => {
                setStyle((style) => ({ ...style, height: 0, padding: '0px 8px', marginBottom: 0 }));
            }, 5000),
            setTimeout(onDispose, 6000),
        ];
        return () => {
            for (let timer of timers) {
                clearTimeout(timer);
            }
        };
    }, []);

    return (
        <div
            ref={ref}
            style={{
                boxSizing: 'border-box',
                overflow: 'hidden',
                borderRadius: 8,
                backgroundColor: 'rgba(0,0,0,.45)',
                fontSize: 14,
                transition: [
                    'opacity .5s ease-in-out',
                    'height .5s ease-in-out',
                    'padding .5s ease-in-out',
                    'marging .5s ease-in-out',
                ].join(', '),
                ...style,
            }}
        >
            {msg}
        </div>
    );
}
