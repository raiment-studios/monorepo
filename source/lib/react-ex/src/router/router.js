import React from 'react';

/**
 * Replaces the method named `methodName` on `object` with a modified
 * version as specified by the `params` options.  Returns a function
 * that, when called, returns the object's method back to its prior
 * value.
 *
 * While this is a generic function, it is included in this file to
 * reduce dependencies on other libraries.
 *
 * Params
 *
 * * params.prologue - a function to call before the base method is invoked
 * * params.epilogue - a function to call after the base method is invoked
 *
 */
function overrideMethod(object, methodName, params) {
    const original = object[methodName];
    object[methodName] = function (...args) {
        if (params.prologue) {
            params.prologue();
        }

        const ret = original.call(this, ...args);

        if (params.epilogue) {
            params.epilogue();
        }

        return ret;
    };

    return () => {
        object[methodName] = original;
    };
}

let globalRegistrationCount = 0;

/**
 * A React Component that uses browser listeners and events to detect URL updates
 * and change which Components are rendered under it in the DOM tree.
 */
export class Router extends React.Component {
    // Globally register the Router listeners once
    _listenerRegistrationCount = 0;

    state = {
        // A "meaningless" state value that, when changed, forces a rerender
        incarnation: 0,
    };

    // Undo any patching of pushState()
    _restorePushState = null;
    _restoreReplaceState = null;

    componentDidMount() {
        if (this._listenerRegistrationCount === 0) {
            if (globalRegistrationCount === 0) {
                window.addEventListener('click', this._handleClick);
            }
            window.addEventListener('popstate', this._handlePopState);
            window.addEventListener('hashchange', this._handleHashChange);

            // There is no standard DOM 'pushstate' event so override the global
            // history object's method. Overriding standard method behaviors is
            // generally to be avoided (as unsuspecting users of the standard functions
            // will find it does not have the standard functionality), but I'm not
            // aware of a standard way to intercept these URL updates otherwise.
            this._restorePushState = overrideMethod(history, 'pushState', {
                epilogue: () => {
                    this._handlePushState();
                },
            });
            this._restoreReplaceState = overrideMethod(history, 'replaceState', {
                epilogue: () => {
                    this._handleReplaceState();
                },
            });
        }
        this._listenerRegistrationCount++;
        globalRegistrationCount++;

        this._remapRouteQuery();
    }

    shouldComponentUpdate() {
        return true;
    }

    componentWillUnmount() {
        globalRegistrationCount--;
        this._listenerRegistrationCount--;
        if (this._listenerRegistrationCount === 0) {
            if (globalRegistrationCount === 0) {
                window.removeEventListener('click', this._handleClick);
            }
            window.removeEventListener('popstate', this._handlePopState);
            window.removeEventListener('hashchange', this._handleHashChange);
            this._restorePushState();
        }
    }

    /**
     * Takes a URL path specified as query parameter and makes that the actual URL path.
     * This is useful for true single-page webapps (that are only served at the root)
     * and do client-side path modification. In conjunction with 404 handling that can
     * redirect the unknown path to the root page with the desired path as a query parameter,
     * this allows a single-page webapp to effectively handle full paths.
     *
     * NOTE: if you have control to override the 404, couldn't the webapp also be served
     * as the 404 page and handle this more directly?
     */
    _remapRouteQuery() {
        const url = new URL(window.location);
        const query = new URLSearchParams(url.searchParams);

        const queryPathname = query.get('_pathname');
        history.pushState(null, '', queryPathname);
    }

    _handlePushState = () => {
        this._rerender();
    };
    _handleReplaceState = () => {
        this._rerender();
    };

    _handlePopState = (evt) => {
        evt.preventDefault();
        this._rerender();
    };

    _handleHashChange = (evt) => {};

    /**
     * Globally intercept clicks so that <A/> tags can go straight to the
     * history object rather than to the browser, thus allowing this to act like
     * a single page web application.
     *
     * External links are always opened in a new tab.
     */
    _handleClick = (evt) => {
        // Walk up the tree to the nearest A element
        let node = evt.target;
        while (node && node.tagName !== 'A') {
            node = node.parentNode;
        }
        if (!node) {
            return;
        }

        const href = node.getAttribute('href');
        if (!href) {
            return;
        }

        // Handle external links. Open them in a new tab
        if (href.match(/^https?:\/\//)) {
            // Ensure fully specificed (i.e. including protocol) links are opened in new windows
            evt.preventDefault();
            evt.stopPropagation();
            window.open(href);
            return;
        }

        // Internal links: prevent the normal click behavior and update the URL "directly"
        // without navigation away from the page.
        evt.preventDefault();

        // Use the standard DOM to do the parsing
        const { hash, pathname, search } = node;
        this._updateBrowserURL({
            pathname,
            hash,
            search,
        });
    };

    // Helper to update the browser URL via a set of parameters
    _updateBrowserURL(params) {
        const keys = Object.keys(params);
        const url = new URL(window.location);
        const diff = {};
        let changes = 0;
        keys.forEach((key) => {
            if (url[key] !== params[key]) {
                changes++;
                diff[key] = [url[key], params[key]];
                url[key] = params[key];
            }
        });
        if (changes === 0) {
            return;
        }

        history.pushState(null, '', url.toString());
        if (changes === 1 && diff.hash !== undefined) {
            const elem = document.querySelector(`[name="${params.hash.replace(/^#/, '')}"]`);
            if (elem) {
                elem.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            this._rerender();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    /**
     * Force a Component render. This should be done whenever the route has changed to ensure
     * the correct children are rendered.
     */
    _rerender() {
        this.setState((state) => {
            return { incarnation: state.incarnation + 1 };
        });
    }

    render() {
        const { routes = {}, defaultRoute, children } = this.props;

        //
        // window.location *is* the "state".  This avoids having to ensure
        // React state and browser state are kept in sync as there's nothing
        // to keep in sync.  (Note: this is a reaction to seeing many reasonably
        // skilled developers misuse react-router due to its design.)
        //
        const url = new URL(window.location);
        const query = new URLSearchParams(url.searchParams);
        let pathname = query.get('_pathname');
        if (!pathname) {
            pathname = url.pathname;
        }

        const params = {};
        query.forEach((value, key) => {
            params[key] = value;
        });
        params.pathname = pathname;

        const props = { router: params };

        // --- 1: Check for exact match ---

        if (routes[pathname]) {
            return routes[pathname](props);
        }

        // --- 2: Check for parameterized match ---
        //
        // :[a-z]: -> converted to match group
        //
        //
        // TODO: add a cache for the path not having changed since last time?
        // TODO: move to user-specified regular experessions rather than custom syntax?
        //
        const keys = Object.keys(routes);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const src = `^${key.replace(/:([^/]+):/g, '(?<$1>[^/]+)')}$`;
            const re = new RegExp(src);

            const m = pathname.match(re);
            if (m) {
                const unescaped = {};
                for (let [key, value] of Object.entries(m.groups)) {
                    unescaped[key] = decodeURIComponent(value);
                }
                return routes[key]({ ...params, ...unescaped });
            }
        }

        const indexPage = `${pathname.replace(/\/$/, '')}/index`;
        if (routes[indexPage]) {
            return routes[indexPage](props);
        }

        //
        // --- 3: Use the default route  ---
        //
        // Note this can be specified by either a defaultRoute parameter,
        // which allows the params to be received, or via React children, which
        // be stylistically "cleaner feeling" if the params aren't needed.
        //
        if (defaultRoute) {
            return defaultRoute(props);
        }
        if (children) {
            return children;
        }

        //
        // --- 4: Last ditch default 404 ---
        //
        return (
            <div>
                <h1>404: Page Not Found</h1>
                <pre>pathname: {pathname}</pre>
            </div>
        );
    }
}
