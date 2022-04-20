/*!@sea:header

    imports: 
        lodash: 3        
 */

import React from 'react';
import _ from 'lodash';

const people = [
    {
        name: 'Jane',
        email: 'jane@example.com',
    },
    {
        name: 'Carrie',
        email: 'carrie@example.com',
    },
];

export default function () {
    // Intentionally use the _.pluck function that was deprecated in v4+
    // to ensure the front matter is being processed correctly
    return <h1>Hello {_.pluck(people, 'name')[0]}</h1>;
}
