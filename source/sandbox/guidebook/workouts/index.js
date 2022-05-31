import React from 'react';
import { ReadingFrame } from '@raiment/react-ex';
import database from 'yaml:workout-data.yaml';

export default function () {
    return (
        <ReadingFrame>
            <h1>Workouts</h1>
            {database && <WorkoutView db={database} />}
        </ReadingFrame>
    );
}

function WorkoutView({ db }) {
    return (
        <div>
            {Object.entries(db.workouts).map(([group, list]) => (
                <div key={group}>
                    <h3>{group}</h3>
                    <div>
                        {list?.map((workout, index) => (
                            <div key={index}>
                                {workout.parts?.map((part, i) => (
                                    <div key={i}>
                                        <code>{part}</code>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
