/*
🚧 TODO
- Ensure model and trees don't overlap
- Click to select building
- Pop-up "story" dialog when building selected after moving close to it
*/

import React from 'react';
import { ReadingFrame } from '../../../react-ex';
import * as core from '../../../core';
import * as THREE from 'three';
import {
    useEngine,
    EngineFrame,
    Grid,
    OrbitCamera,
    GroundPlane,
    HeightMap,
    PathfinderGraph,
    VoxelSprite,
    DayNightLighting,
    VOXActor,
    TerrainMorphHeight,
    TerrainMorphAverage,
} from '../..';
import { TreeActor } from './forest.js';
import assets from 'glob:$(MONOREPO_ROOT)/source;assets/**/*{.png,.asset.yaml,.vox}';
import { initTileLookupTable } from './tiles';
import { componentPathfinder } from './component_pathfinder';

const assetURL = Object.fromEntries(assets.matches.map(({ url }) => [url.split('/').pop(), url]));

export default function () {
    return (
        <ReadingFrame>
            <h1>Interaction</h1>
            <div>
                <EngineView />
            </div>
        </ReadingFrame>
    );
}

const db = {
    tiles: initTileLookupTable(),
};
const TILE = db.tiles.keys();

function makeHeightMap(rng) {
    const S = 192;
    const simplex1 = core.makeSimplexNoise(rng.uint31());
    const simplex2 = core.makeSimplexNoise(rng.uint31());
    const simplex3 = core.makeSimplexNoise(rng.uint31());

    const heightMap = new HeightMap({
        offset: [-256 / 2, -256 / 2, 0],
        scale: 256,
        segments: 256,
        layers: {
            tile: Int8Array,
            object: Int16Array,
            malleability: Float32Array,
        },
        heightFunc: (sx, sy) => {
            const nx = sx + 5 * simplex1.noise2D((4 * sx) / S, (4 * sy) / S);
            const ny = sy + 5 * simplex2.noise2D((4 * sx) / S, (4 * sy) / S);
            const a = 1 + simplex3.noise2D(nx / S, ny / S) / 2;
            return 0.1 * Math.pow(1.1 * a, 1.5);
        },
    });

    const tileArray = heightMap.getLayerArray('tile');
    const objectArray = heightMap.getLayerArray('object');
    const malleabilityArray = heightMap.getLayerArray('malleability');

    tileArray.fill(TILE.GRASS);
    objectArray.fill(0);
    malleabilityArray.fill(1.0);

    heightMap.colorFunc = function (sx, sy, wz, si) {
        const tile = db.tiles.get(tileArray[si]);
        const rgb = tile.colorFunc(sx, sy);
        return rgb;
    };

    heightMap.updateMesh();

    return heightMap;
}

function EngineView() {
    const engine = useEngine(() => {
        const rng = core.makeRNG();

        const heightMap = makeHeightMap(rng);
        const tileArray = heightMap.getLayerArray('tile');

        engine.events.on('intersection', (results) => {
            const { x, y } = results.first.point;
            const actor = engine.actors.selectByID('kestrel');
            if (actor) {
                actor._goal = ['move', x, y];
            }
        });
        engine.events.on('engine.preupdate', () => {
            const actor = engine.actors.selectByID('kestrel');
            const camera = engine.actors.selectByID('camera');
            if (!actor || !camera) {
                return;
            }
            camera.radius = 24;
            camera.offsetZ = 2;
            const pt = actor.position.clone();
            pt.z += 5;
            camera.lookAt(pt);
        });

        engine.actors.push(
            new Grid(),
            new OrbitCamera({ radius: 72, periodMS: 20000, offsetZ: 48 }), //
            new DayNightLighting({ speed: 1, nightSpeed: 16 }),
            new GroundPlane(),
            heightMap
        );

        engine.addSequence(function* () {
            engine.actors.push(new TerrainMorphHeight({ heightMap }));
            engine.actors.push(new TerrainMorphAverage({ heightMap }));

            for (let i = 0; i < 3; i++) {
                const actor = new VOXActor({
                    url: assetURL[
                        rng.select([
                            'obj_house3a.vox', //
                            'obj_house5c.vox', //
                            'obj_house5c.vox', //
                        ])
                    ],
                    scale: 2,
                    flags: {
                        pinToGroundHeight: true,
                        castShadow: true,
                    },
                    rotation: (Math.PI / 2) * rng.rangei(0, 4),
                });
                yield placeActor({ engine, actor, heightMap });
                yield;
            }

            for (let clusters = 0; clusters < 24; clusters++) {
                const cx = rng.rangei(0, heightMap.segments);
                const cy = rng.rangei(0, heightMap.segments);
                const count = rng.rangei(3, 8);
                for (let i = 0; i < count; i++) {
                    const actor = new TreeActor();
                    yield placeActor({
                        engine,
                        actor,
                        heightMap,
                        generatePosition: (rng, minX, minY, maxX, maxY) => {
                            return [cx + rng.rangei(-20, 20), cy + rng.rangei(-20, 20)];
                        },
                    });
                    yield;
                }
                yield 10;
            }

            engine.actors.push(generateKestrel({ engine, heightMap }));

            yield 30;
            engine.actors.push(new TerrainMorphHeight({ heightMap }));
            engine.actors.push(new TerrainMorphAverage({ heightMap }));
        });

        engine.opt.generateRandomWalkablePosition = function () {
            const walkable = (wx, wy) => {
                const si = heightMap.coordW2I(wx, wy);
                if (si === -1) {
                    return false;
                }
                const tileIndex = tileArray[si];
                return tileIndex === TILE.GRASS;
            };

            let worldX, worldY;
            do {
                worldX = rng.rangei(0, heightMap.segments);
                worldY = rng.rangei(0, heightMap.segments);
            } while (!walkable(worldX, worldY));

            return [worldX, worldY];
        };

        engine.addSequence(function* () {
            yield 10;
            engine.journal.message('Welcome to Galthea, the world of Kestrel');
            yield 2 * 60;
            engine.journal.message('Your quest is to seek out Tristan.');
        });
    });

    return <EngineFrame engine={engine} recorder="three" />;
}

function generateKestrel({ engine, heightMap }) {
    let [worldX, worldY] = engine.opt.generateRandomWalkablePosition();

    const actor = new VoxelSprite({
        id: 'kestrel',
        url: assetURL['kestrel.png'],
        flags: {
            billboard: true,
            pinToGroundHeight: true,
        },
        worldX,
        worldY,
        stateMachine: function ({ engine, actor }) {
            // The goal is the "overall" motivation for the actor.  So the FSM
            // should continually look to that to decide it's own execution and
            // transitions.
            actor._goal = null;

            return {
                _start: function* () {
                    return 'idle';
                },
                idle: function* () {
                    yield 30;
                    if (actor._goal?.[0] === 'move') {
                        let [cmd, x, y] = actor._goal;
                        actor._goal = null;
                        x = Math.floor(x);
                        y = Math.floor(y);
                        engine.journal.message(`Kestrel decides to move to ${x},${y}`);
                        return ['move', x, y];
                    }
                    return 'idle';
                },
                move: function* (wx, wy) {
                    const [sx, sy] = heightMap.coordW2S(wx, wy);
                    return ['pathfind.moveLoop', sx, sy, 'idle'];
                },
            };
        },
    });

    ///////////////////////////////////////////////////////////////////////////

    const heightArray = heightMap.getLayerArray('height');
    const tileArray = heightMap.getLayerArray('tile');
    const SEGMENTS = heightMap.segments;

    const tileAt = (sx, sy) => {
        if (!(sx >= 0 && sx < SEGMENTS && sy >= 0 && sy < SEGMENTS)) {
            return null;
        }
        return db.tiles.get(tileArray[sy * SEGMENTS + sx]);
    };

    const walkable = (sx, sy) => {
        const tile = tileAt(sx, sy);
        return tile ? tile.walkable : false;
    };

    // Pathfinding object...
    const pathfinder = new PathfinderGraph({
        width: SEGMENTS,
        height: SEGMENTS,
        walkable,
        baseCost: (a) => tileAt(a.x, a.y)?.walkCost ?? 0.0,
        edgeCost: (a, b) => {
            const hb = heightArray[b.y * SEGMENTS + b.x];
            const ha = heightArray[a.y * SEGMENTS + a.x];
            return Math.max(0, 10 * (hb - ha));
        },
    });

    actor.mixin(componentPathfinder, {
        pathfinder,
        moveDelay: 4,
        positionFunc: ({ actor }) => {
            return heightMap.coordW2S(actor.position.x, actor.position.y);
        },
        onMove: (sx, sy) => {
            const [wx, wy] = heightMap.coordS2W(sx, sy);
            actor.position.x = wx;
            actor.position.y = wy;
        },
        interruptFunc: (sx, sy) => {
            const [wx, wy] = heightMap.coordS2W(sx, sy);
            if (
                actor._goal &&
                (actor._goal[0] !== 'move' || actor._goal[1] !== wx || actor._goal[2] !== wy)
            ) {
                return 'idle';
            }
            return null;
        },
    });

    ///////////////////////////////////////////////////////////////////////////

    return actor;
}

async function placeActor({
    engine,
    actor,
    heightMap,

    generatePosition = (rng, minX, minY, maxX, maxY) => {
        const sx = rng.rangei(minX, maxX);
        const sy = rng.rangei(minY, maxY);
        return [sx, sy];
    },
}) {
    const rng = engine.rng;
    const tileArray = heightMap.getLayerArray('tile');
    const heightArray = heightMap.getLayerArray('height');
    const malleabilityArray = heightMap.getLayerArray('malleability');

    const constraints = await actor.placementConstraints({ engine });
    const bbox = constraints.box3;
    const size = new THREE.Vector3();
    bbox.min.floor();
    bbox.max.ceil();
    bbox.getSize(size);

    const {
        malleabilityExponent = 1,
        malleabilityExtents = 8, //
        walkableBoundary = 2,
        foundationSize = null,
    } = constraints;

    const minX = -bbox.min.x;
    const minY = -bbox.min.y;
    const maxX = heightMap.segments - size.x - minX;
    const maxY = heightMap.segments - size.y - minY;

    const cursor = new core.Cursor2D(heightMap.segments, heightMap.segments);

    let placement = null;
    for (let attempt = 0; placement === null && attempt < 20; attempt++) {
        const ε = 1e-6;

        const [sx, sy] = generatePosition(rng, minX, minY, maxX, maxY);
        if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
            continue;
        }

        const modelBox = new THREE.Box2();
        modelBox.min.set(sx + bbox.min.x, sy + bbox.min.y);
        modelBox.max.set(sx + bbox.max.x, sy + bbox.max.y);

        let valid = true;
        const stats = new core.SimpleStats();
        cursor.box(modelBox, { inflate: walkableBoundary }, ({ index }) => {
            const tile = db.tiles.get(tileArray[index]);
            if (!tile.walkable) {
                valid = false;
            }
            stats.add(heightArray[index]);
        });
        if (!valid) {
            continue;
        }

        // If an explicit size has been set, use that rather than the model bounds
        let malleabilityBase = 0.0;
        if (foundationSize !== null) {
            const center = new THREE.Vector2();
            modelBox.getCenter(center);
            modelBox.setFromCenterAndSize(
                center,
                new THREE.Vector2(foundationSize, foundationSize)
            );
            if (foundationSize === 0) {
                malleabilityBase = 1.0;
            }
        }

        const baseHeight = (stats.average() * 2) / 3 + stats.max() / 3;
        cursor.box(modelBox, ({ index }) => {
            tileArray[index] = db.tiles.getDerived(tileArray[index], { walkable: false });
            heightArray[index] = baseHeight;
            malleabilityArray[index] = malleabilityBase;
        });

        const innerBounds = modelBox.clone();
        innerBounds.max.addScalar(-ε);

        cursor.box(modelBox, { inflate: malleabilityExtents }, ({ x, y, index }) => {
            const pt = new THREE.Vector2(x, y);
            const dist = innerBounds.distanceToPoint(pt);
            if (dist > 0) {
                const a1 = Math.pow(core.clamp(dist / malleabilityExtents, 0, 1), 0.75);
                const a0 = 1 - a1;
                const c = heightArray[index];
                heightArray[index] = baseHeight * a0 + a1 * c;
                const value = Math.pow(a1, malleabilityExponent);

                malleabilityArray[index] = Math.min(malleabilityArray[index], value);
            }
        });

        cursor.box(modelBox, { inflate: malleabilityExtents + 1 }, ({ x, y }) => {
            heightMap.updateSegment(x, y);
        });
        placement = { sx, sy };
    }
    if (placement === null) {
        console.warn('Could not place actor', actor);
        return false;
    }

    const { sx, sy } = placement;

    const [wx, wy] = heightMap.coordS2W(sx, sy);
    actor.position.set(wx, wy, 0.0);
    engine.actors.push(actor);

    return true;
}
