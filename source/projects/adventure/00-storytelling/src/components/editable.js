import React from 'react';
import { set, get } from 'lodash';

export function Editable({
    id, //
    className,
    style,
    onKeyDown,
    data,
    field,
    onSave,
    onBlur,
}) {
    return (
        <div
            id={id}
            className={className}
            style={style}
            suppressContentEditableWarning
            contentEditable
            spellCheck={false}
            onInput={(evt) => {
                // TODO: read innHTML & convert HTML to markdown
                set(data, field, evt.target.innerText);
                onSave && onSave();
            }}
            onBlur={onBlur || onSave}
            onKeyDown={onKeyDown}
        >
            {get(data, field)}
        </div>
    );
}
