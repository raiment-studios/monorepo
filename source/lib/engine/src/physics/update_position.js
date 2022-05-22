export function updatePosition(actor, dt) {
    actor.velocity.addScaledVector(actor.acceleration, dt);
    actor.position.addScaledVector(actor.velocity, dt);
}
