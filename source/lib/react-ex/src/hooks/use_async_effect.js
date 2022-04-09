import React from 'react';

/**
    Variation of React.useEffect() for async functions.

    Differs from useEffect() in several ways to account for the async function:

    (1) The effect callback is passed a "token" object that can be used to check
        if the Component is still mounted and valid. If it has been unmounted,
        the token will properly interrupt execution.
    
    (2) The context object also contains a unwind() method for registering a clean-up
        step at any point in the effect (since the effect is not guarenteed to fully
        execute without interruption).

    (3) The async callback does not have a return value as it cannot be meaningfully
        used for clean-up. The cleanup handler array should be used instead.

*/
export function useAsyncEffect(callback, deps = []) {
    React.useEffect(() => {
        // Create an unique object to identify the interruption
        // exception

        // Since closures copy values, the mutable state needs
        // to be in an object.
        const token = new Token();

        callback(token)
            .catch((e) => {
                for (let cb of token._unwindCallbacks) {
                    cb();
                }
                token._unwindCallbacks = [];

                // Ensure the exception in question is from the unmount. Otherwise,
                // this code does not know how to properly handle the exception
                // and should pass it along.
                if (e !== INTERRUPTED) {
                    throw e;
                }
            })
            .finally(() => {});

        return () => {
            token._cancel = true;

            for (let cb of token._unwindCallbacks) {
                cb();
            }
            token._unwindCallbacks = [];
        };
    }, deps);
}

const INTERRUPTED = Symbol();

class Token {
    constructor() {
        this._cancel = false;
        this._unwindCallbacks = [];
    }

    active() {
        return !this._cancel;
    }

    check() {
        if (this._cancel) {
            throw INTERRUPTED;
        }
    }

    unwind(fn) {
        this._unwindCallbacks.push(fn);
    }

    sleep(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (this._cancel) {
                    reject(INTERRUPTED);
                } else {
                    resolve();
                }
            }, ms);
        });
    }
    yield() {
        return this.sleep(0);
    }
}
