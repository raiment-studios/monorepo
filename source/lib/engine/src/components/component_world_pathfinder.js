import { PathfinderGraph } from '../ai/pathfinder_graph';
import { componentPathfinder } from './component_pathfinder';

/**
 * A reusable set of state machine states for pathfinding.
 *
 * Avoids binding to the Actor or Heightmap classes and instead depends on
 * only the PathfinderGraph object and a current position callback.
 *
 * Returns a set of states which can be merged into a StateMachine descriptor.
 */
export function componentWorldPathfinder({ actor }, { engine, heightMap, onMove }) {
    heightMap = heightMap ?? engine.actors.selectByID('terrain');
    console.assert(heightMap, `componentWorldPathfinder requires a 'terrain' object`);

    const heightArray = heightMap.getLayerArray('height');

    onMove ??= (wx, wy) => {
        actor.position.x = wx;
        actor.position.y = wy;
    };
    onMove = onMove.bind(actor);

    return componentPathfinder(
        { actor },
        {
            pathfinder: new PathfinderGraph({
                width: heightMap.segments,
                height: heightMap.segments,
                walkable: (sx, sy) => heightMap.layers.tile.lookup(sx, sy).walkable ?? true,
                baseCost: (a) => heightMap.layers.tile.lookup(a.x, a.y)?.walkCost ?? 0.0,
                edgeCost: (a, b) => {
                    const hb = heightArray[b.y * heightMap.segments + b.x];
                    const ha = heightArray[a.y * heightMap.segments + a.x];
                    return Math.max(0, 10 * (hb - ha));
                },
            }),
            moveDelay: 6,
            positionFunc: ({ actor }) => {
                return heightMap.coordW2S(actor.position.x, actor.position.y);
            },
            onMove: (sx, sy) => {
                const [wx, wy] = heightMap.coordS2W(sx, sy);
                return onMove(wx, wy);
            },
        }
    );
}
