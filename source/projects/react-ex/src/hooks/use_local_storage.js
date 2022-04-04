import React from 'react';

/**
 * Similar to React.useState but stores the underlying value in browser local storage
 * so that the value is persisted across page reloads.
 *
 * @param {*} key
 * @param {*} initialValue
 * @returns
 */
export function useLocalStorage(key, initialValue) {
    if (arguments.length < 2) {
        throw new Error('Incorrect number of arguments');
    }

    // Pass initial state function to useState so logic is only executed once
    const [storedValue, setStoredValue] = React.useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            if (!item) {
                const valueToStore =
                    initialValue instanceof Function ? value(storedValue) : initialValue;
                window.localStorage.setItem(key, JSON.stringify({ value: valueToStore }));
                return initialValue;
            }
            const data = JSON.parse(item);
            return data.value;
        } catch (error) {
            // If error also return initialValue
            console.log(error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);

            window.localStorage.setItem(key, JSON.stringify({ value: valueToStore }));
        } catch (error) {
            console.log(error);
        }
    };

    return [storedValue, setValue];
}
