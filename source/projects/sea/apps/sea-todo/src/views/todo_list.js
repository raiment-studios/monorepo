import React from 'react';

export function TodoList({ database }) {
    console.count('TodoList.render');
    return (
        <>
            {database.select().map((item) => (
                <ItemRow key={item.id} item={item} />
            ))}
        </>
    );
}
function ItemRow({ item }) {
    const [value, setValue] = React.useState(item.title);
    React.useEffect(() => {
        setValue(item.value);
    }, [item]);

    return (
        <div
            className="flex-row-center"
            style={{
                margin: '4px 0',
            }}
        >
            <div style={{ width: 2 }} />
            <div
                style={{
                    width: 12,
                    height: 12,
                    margin: 2,
                    border: 'solid 1px #777',
                    background: item.done ? '#CCC' : 'transparent',
                    borderRadius: 12,
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onClick={() => {
                    item.update({ done: !item.done });
                }}
            />
            <div style={{ width: 8 }} />
            <input
                style={{
                    border: 'none',
                    outline: 'none',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                }}
                defaultValue={value}
                onChange={(evt) => setValue(evt.target.value)}
            />
        </div>
    );
}
