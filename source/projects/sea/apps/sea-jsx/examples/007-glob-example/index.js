import React from 'react';
import files from 'glob:assets/**/*';

export default function () {
    return (
        <div>
            <pre>{JSON.stringify(files, null, 4)}</pre>
        </div>
    );
}
