import React from 'react';
import * as core from '../../../../lib/core';
import * as ReactEx from '../../../../lib/react-ex';
import { Type } from '../../../../lib/react-ex';
import { AssetAutoReloader } from './src/asset_auto_reloader';
import { CardConceptArt } from './src/card_concept_art';
import { Palette } from './src/palette';
import { Drawer } from './src/drawer';

export default function () {
    return <AssetAutoReloader onReady={(assets) => <Application assets={assets} />} />;
}

function Application({ assets }) {
    return (
        <ReactEx.ReadingFrame>
            <h1>Hello World!</h1>

            <Drawer uuid={'design-palettes'} Header={() => <Type h2>Design / Palettes</Type>}>
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
