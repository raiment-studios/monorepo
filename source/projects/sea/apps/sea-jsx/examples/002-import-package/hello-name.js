import React from 'react';
import { randEmail, randFullName } from '@ngneat/falso';

export default function () {
    return (
        <h1>
            Hello {randFullName()} ({randEmail()})
        </h1>
    );
}
