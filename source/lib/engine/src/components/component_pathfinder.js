import * as core from '../../../core';

/**
 * A reusable set of state machine states for pathfinding.
 *
 * Avoids binding to the Actor or Heightmap classes and instead depends on
 * only the PathfinderGraph object and a current position callback.
 *
 * Returns a set of states which can be merged into a StateMachine descriptor.
 */
export function componentPathfinder(
    { actor },
    {
        // Required
        pathfinder,
        positionFunc,
        onMove,
        // Options
        prefix = 'pathfind.', //
        MAX_SEARCH_DISTANCE = 100,
        rng = core.makeRNG(),
        moveDelay = 0,
        interruptFunc,
    }
) {
    const prefixName = (s) => `${prefix}${s}`;
    const STATE_TARGET = prefixName('target');
    const STATE_MOVE = prefixName('move');
    const STATE_MOVELOOP = prefixName('moveLoop');

    return {
        stateMachine: () => ({
            [STATE_TARGET]: function* () {
                // "Think" for a few frames
                yield rng.rangei(5, 10);

                // Choose a random point to target and retry until it
                // is a valid destination
                const ex = rng.rangei(0, pathfinder.width);
                const ey = rng.rangei(0, pathfinder.height);
                if (!pathfinder.walkable(ex, ey)) {
                    return STATE_TARGET;
                }
                return [STATE_MOVELOOP, ex, ey];
            },
            [STATE_MOVELOOP]: function* (ex, ey, doneState = STATE_TARGET) {
                // Use the current position as the starting point
                const [sx, sy] = positionFunc({ actor });
                if (!pathfinder.walkable(sx, sy)) {
                    console.error('starting on an unwalkable tile');
                }

                // If we're at the destination, end the loop and choose a new target
                if (sx === ex && sy === ey) {
                    return doneState;
                }

                // If the destination is "far away", compute a path to an intermediate
                // point.  Otherwise, compute the path to the destination
                const dx = ex - sx;
                const dy = ey - sy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const m = dist / MAX_SEARCH_DISTANCE;
                let result;
                if (m <= 1) {
                    result = yield pathfinder.pathfind(sx, sy, ex, ey);
                } else {
                    // Choose the naive "ideal" intermediate point (straight-line to the
                    // target)
                    const xi = Math.ceil(sx + dx / m);
                    const yi = Math.ceil(sy + dy / m);

                    // Make that the guess as to where we should go next
                    let xg = xi;
                    let yg = yi;

                    let jitter = 1.0;
                    while (!pathfinder.walkable(xg, yg)) {
                        xg = xi + Math.floor(rng.sign() + rng.range(1, jitter));
                        yg = yi + Math.floor(rng.sign() + rng.range(1, jitter));
                        jitter += 0.25;
                    }

                    result = yield pathfinder.pathfind(sx, sy, xg, yg);
                }

                // Move!
                const path = result.map((g) => ({ x: g[0], y: g[1] }));
                return [STATE_MOVE, path, ex, ey, doneState];
            },

            [STATE_MOVE]: function* (path, ex, ey, doneState) {
                let x, y;
                while (path.length) {
                    ({ x, y } = path.shift());
                    onMove(x, y);

                    const interruptState = interruptFunc?.(x, y);
                    if (interruptState) {
                        return interruptState;
                    }

                    yield moveDelay;
                }
                return [STATE_MOVELOOP, ex, ey, doneState];
            },
        }),
    };
}
