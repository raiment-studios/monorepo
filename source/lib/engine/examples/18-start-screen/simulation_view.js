import React from 'react';
import { Flex } from '../../../react-ex/src';
import { EngineFrame, useEngine, TreeActor } from '../../src';
import * as THREE from 'three';
import * as core from '../../../core';

export function SimulationView({ initSequence }) {
    const engine = useEngine(() => {
        engine.sequence(initSequence);
    });

    const toolbarButtons = [
        {
            image: `base/sprites/tree-01.png`,
            handleClick: () => {
                engine.sequence(function* () {
                    const rng = engine.rng.fork();
                    const heightMap = engine.actors.selectByID('terrain');
                    const cx = rng.rangei(0, heightMap.segments);
                    const cy = rng.rangei(0, heightMap.segments);
                    const count = rng.rangei(3, 8);
                    for (let i = 0; i < count; i++) {
                        const actor = new TreeActor();
                        yield placeActor({
                            engine,
                            actor,
                            heightMap,
                            generatePosition: (rng) => {
                                return [cx + rng.rangei(-20, 20), cy + rng.rangei(-20, 20)];
                            },
                        });
                    }
                });
            },
        },
        {
            image: `base/sprites/tree-02.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
        {
            image: `base/sprites/signpost-01.png`,
        },
    ];

    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: '#777',
            }}
        >
            <div
                style={{
                    width: '100%',
                    aspectRatio: '16 /9',
                    margin: 0,
                    padding: 0,
                    backgroundColor: '#111',
                    color: 'white',
                }}
            >
                <EngineFrame engine={engine} />
            </div>
            <Flex
                dir="row"
                style={{
                    backgroundColor: 'rgba(0,13,23,0.35)',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '100%',
                        margin: '2px 4px',
                        padding: 2,
                        border: 'solid 1px rgba(255,255,255,0.25)',
                        borderRadius: 4,
                        backgroundColor: 'rgba(13,63,93,0.35)',
                    }}
                >
                    {toolbarButtons.map((entry, index) => (
                        <div
                            key={index}
                            style={{
                                width: 32,
                                height: 32,
                                border: 'solid 1px rgba(255,255,255,0.25)',
                                borderRadius: 4,
                                margin: '2px 4px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                cursor: 'pointer',
                                userSelect: 'none',
                                backgroundImage: `url(${entry.image})`,
                                backgroundSize: 'cover',
                                imageRendering: 'pixelated',
                            }}
                            onClick={entry.handleClick}
                        />
                    ))}
                </div>
            </Flex>
            <Flex
                style={{
                    height: '480px',
                    backgroundColor: '#222',
                    alignItems: 'stretch',
                }}
            >
                <Flex
                    dir="col"
                    className="mono px-2px"
                    style={{
                        flex: '2 0 0',
                        background: '#111',
                        color: '#eee',
                        justifyContent: 'stretch',
                        alignItems: 'stretch',
                        fontSize: 18,
                    }}
                >
                    <Flex dir="row" className="py-4px">
                        <div style={{ flex: '0 0 16px' }}>{'>'}</div>
                        <div>cmd</div>
                    </Flex>
                    <div
                        className="mt-4px mb-8px"
                        style={{
                            height: 1,
                            background: 'rgba(255,255,255,0.35)',
                        }}
                    />
                    <Flex dir="row" align="stretch" g={1}>
                        <div style={{ flex: '0 0 16px' }} />
                        <div>results</div>
                    </Flex>
                </Flex>
                <Flex style={{ flex: '0 0 480px' }}>tools</Flex>
            </Flex>
        </div>
    );
}

async function placeActor({
    engine,
    actor,
    heightMap,
    foundationTile = null,

    generatePosition = (rng, minX, minY, maxX, maxY) => {
        const sx = rng.rangei(minX, maxX);
        const sy = rng.rangei(minY, maxY);
        return [sx, sy];
    },
}) {
    const rng = engine.rng;
    const heightArray = heightMap.getLayerArray('height');
    const malleabilityArray = heightMap.getLayerArray('malleability');

    //
    // Read the actor's constraints on how it should be placed
    //
    const constraints = await actor.placementConstraints({ engine });
    const bbox = constraints.box3;
    const size = new THREE.Vector3();
    bbox.min.floor();
    bbox.max.ceil();
    bbox.getSize(size);

    const {
        malleabilityMin = 0,
        malleabilityExponent = 1,
        malleabilityExtents = 8, //
        walkableBoundary = 2,
        foundationSize = null,
    } = constraints;

    const minX = -bbox.min.x;
    const minY = -bbox.min.y;
    const maxX = heightMap.segments - size.x - minX;
    const maxY = heightMap.segments - size.y - minY;

    //
    // Iteratively make a random selection until constraints are met or the
    // number of attemmpts is exceeded.
    //
    let placement = null;
    const cursor = new core.Cursor2D(heightMap.segments, heightMap.segments);
    for (let attempt = 0; placement === null && attempt < 20; attempt++) {
        const ε = 1e-6;

        const [sx, sy] = generatePosition(rng, minX, minY, maxX, maxY);
        if (sx < minX || sx > maxX || sy < minY || sy > maxY) {
            continue;
        }

        const modelBox = new THREE.Box2();
        modelBox.min.set(sx + bbox.min.x, sy + bbox.min.y);
        modelBox.max.set(sx + bbox.max.x, sy + bbox.max.y);

        //
        // Ensure placement only occurs on currently walkable tiles
        //
        let valid = true;
        const stats = new core.SimpleStats();
        cursor.box(modelBox, { inflate: walkableBoundary }, ({ index }) => {
            const tile = heightMap.layers.tile.lookupIndex(index);
            if (!tile.walkable || !tile.buildable) {
                valid = false;
            }
            stats.add(heightArray[index]);
        });
        if (!valid) {
            continue;
        }

        //
        // Flatten the "foundation" area that the actor covers and mark that
        // terrain as immalleable.
        //
        // If an explicit size has been set, use that rather than the model bounds
        //
        let malleabilityBase = 0.0;
        if (foundationSize !== null) {
            const center = new THREE.Vector2();
            modelBox.getCenter(center);

            const size = Math.max(1, foundationSize);
            modelBox.setFromCenterAndSize(center, new THREE.Vector2(size, size));
        }

        const baseHeight = (stats.average() * 2) / 3 + stats.max() / 3;
        cursor.box(modelBox, ({ index }) => {
            if (foundationTile !== null) {
                heightMap.layers.tile.setAtIndex(index, foundationTile);
            } else {
                heightMap.layers.tile.mutateAtIndex(index, { walkable: false });
            }
            heightArray[index] = baseHeight;
            if (foundationSize !== 0) {
                malleabilityArray[index] = malleabilityBase;
            }
        });

        // Both...
        //
        // (1) Blend the heights of area surrounding the foundation with the foundation
        // height to smooth the transitions.
        //
        // (2) Reduce the malleability of the area surrounding the foundation so that
        // future terrain modifications tend to leave smooth transitions.
        //
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

                const value =
                    malleabilityMin + (1 - malleabilityMin) * Math.pow(a1, malleabilityExponent);
                malleabilityArray[index] = Math.min(malleabilityArray[index], value);
            }
        });

        //
        // As heights have changed, update the region.  Remember that the neighbors
        // of any segment whose height has changed also need to be updated.
        //
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
