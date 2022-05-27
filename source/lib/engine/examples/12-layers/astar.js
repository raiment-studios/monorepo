import Heap from 'heap';

/**
 * A* algorithm optimized for a 2D weighted array.
 *
 * ### This ia heavily modified version of code derived from:
 *
 * javascript-astar 0.4.1
 * http://github.com/bgrins/javascript-astar
 * Freely distributable under the MIT License.
 * Implements the astar search algorithm in javascript using a Binary Heap.
 * Includes Binary Heap (with modifications) from Marijn Haverbeke.
 * http://eloquentjavascript.net/appendix2.html
 */

/**
 * Note that cost are in "distance": so if there's a cost +5 to a particular edge,
 * that means the algorithm choose any alternate route of < 5 units of distance
 * to avoid that edge (assuming all other edges are cost 0).
 */
export class PathfinderGraph {
    constructor(width, height, baseWeightFunc, edgeCostFunc) {
        this._baseWeightFunc = baseWeightFunc;
        this._edgeCostFunc = edgeCostFunc;
        this.nodes = new Array(width * height);
        this.width = width;
        this.height = height;

        let i = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.nodes[i] = new Node(x, y);
                i++;
            }
        }
    }

    async pathfind(x0, y0, x1, y1) {
        this.reset();

        // Note: this will be the *closest* node to the target, not necessarily
        // the target
        let node = await astarSearch(this, [x0, y0], [x1, y1]);
        return pathTo(node);
    }

    nodeAt(x, y) {
        return this.nodes[y * this.width + x];
    }

    transitionCost(node0, node1) {
        // dist = the cost if not additional weighting
        // base = the cost of moving to that node, not matter what
        // edge = the cost of this particular transition
        const dist = nodeDistance(node0, node1);
        const base = this._baseWeightFunc(node1);
        const edge = this._edgeCostFunc(node0, node1);

        // Avoid negative numbers since the algorithm will want to always visit those
        // to reduce the overall score, even though that's not the shortest path!
        return dist + Math.max(0, base + edge);
    }

    reset() {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].reset();
        }
    }
}

async function astarSearch(graph, startXY, endXY) {
    // The graph caches data about the current search so it must be reset (and
    // also should not be used for multiple concurrent searches).
    graph.reset();

    const heuristic = nodeDistance;
    const startNode = graph.nodeAt(startXY[0], startXY[1]);
    const endNode = graph.nodeAt(endXY[0], endXY[1]);

    let openHeap = new Heap((a, b) => a.estimate() - b.estimate());
    let closestNode = startNode;

    startNode.remainder = heuristic(startNode, endNode);
    openHeap.push(startNode);

    // Main algorithm:
    //
    // 1. Grab the lowest estimate to process next.  Heap keeps this sorted for us.
    // 2. If that gets us to the end, we're done!
    // 3. Otherwise, visit all the neighbors and produce estimates
    // 4. Move all such neighbors to the open list that have already been estimated
    // 5. If it was already visited, just update the estimate if needed
    while (openHeap.size() > 0) {
        let currentNode = openHeap.pop();
        if (currentNode === endNode) {
            return currentNode;
        }

        // About to visit all the neighbors, so move this to the closed "list"
        currentNode.closed = true;

        for (let neighbor of currentNode.neighbors(graph)) {
            // Not a valid node to process, skip to next neighbor.
            if (neighbor.closed) {
                continue;
            }

            // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
            let cost = currentNode.cost + graph.transitionCost(currentNode, neighbor);
            let beenVisited = neighbor.visited;

            // If this is not on the "open" list yet, or this is a better path, update
            if (!beenVisited || cost < neighbor.cost) {
                neighbor.visited = true;
                neighbor.parent = currentNode;
                neighbor.remainder = heuristic(neighbor, endNode);
                neighbor.cost = cost;

                const delta = neighbor.estimate() - closestNode.estimate();
                if (delta < 0 || (delta === 0 && neighbor.cost < closestNode.cost)) {
                    closestNode = neighbor;
                }

                if (!beenVisited) {
                    openHeap.push(neighbor);
                } else {
                    openHeap.updateItem(neighbor);
                }
            }
        }
    }

    return closestNode;
}

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.cost = 0; // Minimal known computed  cost to reach this node
        this.remainder = 0; // Guess as to the remaining cost from this node to the destination
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }

    estimate() {
        return this.cost + this.remainder;
    }

    reset() {
        this.cost = 0;
        this.remainder = 0;
        this.visited = false;
        this.closed = false;
        this.parent = null;
    }

    neighbors(graph) {
        const n = [];
        if (this.x > 0) {
            n.push(graph.nodeAt(this.x - 1, this.y));
        }
        if (this.x + 1 < graph.width) {
            n.push(graph.nodeAt(this.x + 1, this.y));
        }
        if (this.y > 0) {
            n.push(graph.nodeAt(this.x, this.y - 1));
        }
        if (this.y + 1 < graph.width) {
            n.push(graph.nodeAt(this.x, this.y + 1));
        }
        return n;
    }
}

function nodeDistance(node0, node1) {
    const dx = node1.x - node0.x;
    const dy = node1.y - node0.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function pathTo(node) {
    let curr = node;
    let path = [];
    while (curr.parent) {
        path.unshift([curr.x, curr.y]);
        curr = curr.parent;
    }
    return path.reverse();
}
