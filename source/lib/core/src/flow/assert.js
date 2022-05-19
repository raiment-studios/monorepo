export function assert(condition, ...msg) {
    if (condition) {
        return;
    }
    if (msg && msg.length) {
        console.error('core.assert failture details:');
        console.error(...msg);
    }
    throw new Error(`core.assert failure`);
}
