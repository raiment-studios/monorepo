import React from 'react';
import * as core from '../../../../lib/core';
import * as ReactEx from '../../../../lib/react-ex';
import { Flex, Type } from '../../../../lib/react-ex';
import { AssetAutoReloader } from './src/asset_auto_reloader';
import { CardConceptArt } from './src/card_concept_art';
import { Palette } from './src/palette';
import { Drawer } from './src/drawer';
import * as fs from './__runtime/fs';

export default function () {
    return <AssetAutoReloader onReady={(assets) => <Application assets={assets} />} />;
}

function Application({ assets }) {
    const handleAdd = async (newAsset) => {
        const asset = { ...newAsset };
        asset.id ??= `unnamed-${core.shortID()}`;
        asset.uuid ??= core.uuid();
        asset.pack ??= null;
        asset.type ??= null;
        asset.schema ??= null;
        asset.version ??= null;
        asset.tags ??= [];
        asset.license ??= null;
        asset.author ??= null;
        asset.status ??= null;
        asset.labels ??= {};
        asset.content ??= null;
        console.log(asset);

        if (!asset.pack || !asset.type || !asset.id) {
            console.error('Invalid asset', asset);
            return;
        }
        await fs.writeFile(
            `assets/${asset.pack}/${asset.type}/${asset.id}.yaml`,
            core.stringifyYAML(asset)
        );
    };

    return (
        <ReactEx.ReadingFrame>
            <h1>Raiment Assets</h1>

            <Drawer uuid={'design-palettes'}>
                <Drawer.Header>
                    <Type h2>Characters</Type>
                </Drawer.Header>
                <CharacterList
                    characters={assets.filter((a) => a.type === 'character')}
                    onAdd={handleAdd}
                />
            </Drawer>
            <Drawer uuid={'design-palettes'}>
                <Drawer.Header>
                    <Type h2>Design / Palettes</Type>
                </Drawer.Header>
                {assets
                    .filter((asset) => asset.type == 'design/palette')
                    .map((asset) => (
                        <Palette key={asset.uuid} palette={asset} />
                    ))}
            </Drawer>

            <div style={{ marginBottom: 12 }}></div>

            <Drawer uuid={'concept-art'} Header={() => <Type h2>Card Concept Art</Type>}>
                <CardGroup assets={assets} />
            </Drawer>
        </ReactEx.ReadingFrame>
    );
}

function CharacterList({ characters, onAdd, onUpdate, onRemove }) {
    return (
        <div>
            <div
                onClick={() => {
                    onAdd({
                        pack: 'base',
                        type: 'character',
                    });
                }}
            >
                <Type link>Add character</Type>
            </div>
            <ol>
                {characters.map((char) => (
                    <li key={char.uuid}>
                        <CharacterRow character={char} />
                    </li>
                ))}
            </ol>
        </div>
    );
}

function CharacterRow({ character }) {
    return (
        <Flex dir="row">
            <Type mr={12}>{character.id}</Type>
            <Type small>{character.id}</Type>
        </Flex>
    );
}

const CardGroup = React.memo(function CardGroupImp({ assets }) {
    const [seed, setSeed] = ReactEx.useLocalStorage('card-group-seed', 0);

    const rng = core.makeRNG(seed);
    const arr = assets.filter((asset) => asset.type === 'card');
    const sorted = rng.shuffle(arr);

    return (
        <>
            <div onClick={() => setSeed(Math.floor(Math.random() * 8192))}>
                <Type link>shuffle</Type>
            </div>
            {sorted.map((asset) => (
                <CardConceptArt key={asset.uuid} asset={asset} />
            ))}
        </>
    );
});
