import React from 'react';
import * as ReactEx from '../../../react-ex';
import { EngineFrame, OrbitCamera } from '../..';
import { Grid } from '../../src/actors/grid';

export default function () {
    return (
        <ReactEx.ReadingFrame>
            <EngineFrame
                actors={[
                    new Grid(),
                    new OrbitCamera(), //
                ]}
            />
        </ReactEx.ReadingFrame>
    );
}
