const testPathForConsistencyCheck = 'some/example.test.js';

function resolveSnapshotPath(testPath, snapshotExtension) {
    return testPath.replace(/\.test\.([tj]sx?)/, `.test${snapshotExtension}`);
}

function resolveTestPath(snapshotFilePath, snapshotExtension) {
    return snapshotFilePath.replace(`.test${snapshotExtension}`, '.test.js');
}

module.exports = {
    testPathForConsistencyCheck,
    resolveSnapshotPath,
    resolveTestPath,
};
