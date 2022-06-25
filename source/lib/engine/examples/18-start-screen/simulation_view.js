import React from 'react';
import { Flex, useAsyncEffect } from '../../../react-ex/src';
import {
    EngineFrame,
    useEngine,
    TreeActor,
    VOXActor,
    VoxelSprite,
    componentGoal,
    componentGoal2,
    componentPathfinder,
    componentPhysicsPVA,
    componentWorldPathfinder,
    PathfinderGraph,
} from '../../src';
import * as THREE from 'three';
import * as core from '../../../core';

import 'glob:$(MONOREPO_ROOT)/source/assets;**/*.vox';
import assetList1 from 'glob:$(MONOREPO_ROOT)/source/assets;**/cards/**/*.{js,yaml}';
import assetList2 from 'glob:./cards/**/*.{js,yaml}';
import { Dialog, DialogCurtain, CenterOverlay } from './dialog';
import { Card } from './card';

export function SimulationView({ initSequence }) {
    const [cards, setCards] = React.useState(null);
    const [activeCard, setActiveCard] = React.useState(null);
    const engine = useEngine(() => {
        engine.events.on('CTRL+R', () => window.location.reload());
        engine.sequence(initSequence);
    });

    useAsyncEffect(
        async (token) => {
            const assetList = [...assetList1, ...assetList2];
            const set = Object.fromEntries(assetList.map((url) => [url, true]));
            const uniqSet = {};
            for (let url of assetList) {
                const base = url.split('.').slice(0, -1).join('.');
                uniqSet[base] = true;
            }

            const results = await Promise.all(
                Object.keys(uniqSet).map(async (url) => {
                    const obj = {};

                    const yamlURL = `${url}.yaml`;
                    const scriptURL = `${url}.js`;
                    if (set[yamlURL]) {
                        const resp0 = await fetch(yamlURL);
                        const text = await resp0.text();
                        Object.assign(obj, core.parseYAML(text));
                    }
                    if (set[scriptURL]) {
                        try {
                            const module = await import(`./${scriptURL}`);
                            const context = {
                                THREE,
                                engine,
                                TreeActor,
                                VOXActor,
                                VoxelSprite,
                                componentGoal,
                                componentGoal2,
                                componentPathfinder,
                                componentPhysicsPVA,
                                componentWorldPathfinder,
                                PathfinderGraph,
                            };
                            const hooks = module.default(context);
                            Object.assign(obj, hooks);
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    return obj;
                })
            );
            token.check();
            setCards(results);
        },
        [engine]
    );

    const toolbarButtons = cards?.filter((c) => c.tags && c.tags.indexOf('toolbar') !== -1) || [];

    return (
        <div
            style={{
                width: '100%',
                minHeight: '100vh',
                backgroundColor: '#777',
            }}
        >
            {activeCard && (
                <DialogCurtain onClick={() => setActiveCard(null)}>
                    <CenterOverlay>
                        <Card card={activeCard} />
                    </CenterOverlay>
                </DialogCurtain>
            )}
            <div
                style={{
                    width: '100%',
                    margin: 0,
                    padding: 0,
                    backgroundColor: '#111',
                    color: 'white',
                }}
            >
                <EngineFrame
                    style={{
                        height: 800,
                    }}
                    engine={engine}
                />
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
                            title={entry.title}
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
                            onClick={() => {
                                const play = entry?.play;
                                if (play) {
                                    engine.sequence(play);
                                } else {
                                    console.warn('No play script');
                                }
                            }}
                            onContextMenu={(evt) => {
                                evt.preventDefault();
                                setActiveCard(entry);
                            }}
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
                    style={{
                        background: 'cyan',
                        flex: '2 0 0',
                        justifyContent: 'stretch',
                        alignItems: 'stretch',
                        maxHeight: '480px',
                    }}
                >
                    <CommandArea engine={engine} />
                </Flex>
                <Flex style={{ flex: '0 0 480px' }}>tools</Flex>
            </Flex>
        </div>
    );
}

function CommandArea({ engine }) {
    const [entries, setEntries] = React.useState([]);

    React.useEffect(() => {
        const remove = engine.events.on('journal.entry', (entry) => {
            setEntries((entries) => {
                return [entry, ...entries];
            });
        });
        return () => remove();
    }, []);

    return (
        <Flex
            dir="col"
            g={1}
            className="mono px-2px"
            style={{
                background: '#111',
                color: '#eee',
                justifyContent: 'stretch',
                alignItems: 'stretch',
                fontSize: 18,
            }}
        >
            <Flex dir="row" className="py-4px">
                <div style={{ flex: '0 0 16px' }}>{'>'}</div>
                <input
                    style={{
                        display: 'block',
                        outline: 'none',
                        border: 'none',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        color: 'inherit',
                        background: 'transparent',
                        margin: 0,
                        padding: 0,
                    }}
                    type="text"
                    placeholder="Type commands here"
                />
            </Flex>
            <div
                className="mt-4px mb-8px"
                style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.35)',
                }}
            />
            <Flex
                dir="col"
                g={1}
                align="stretch"
                style={{ overflowY: 'scroll', maxHeight: '424px' }}
            >
                <div>
                    {entries.map((entry) => (
                        <Flex
                            dir="row"
                            align="stretch"
                            g={1}
                            key={entry.timestamp}
                            style={{ marginBottom: '6px', fontSize: 14, opacity: 0.8 }}
                        >
                            <div style={{ flex: '0 0 16px' }}>*</div>
                            <div style={{ flex: '1 0 0' }}>{entry.value}</div>
                        </Flex>
                    ))}
                </div>
            </Flex>
        </Flex>
    );
}
