/**
 * A* algorithm optimized for a 2D weighted array.
 *
 * -- Derived from --
 *
 * javascript-astar 0.4.1
 * http://github.com/bgrins/javascript-astar
 * Freely distributable under the MIT License.
 * Implements the astar search algorithm in javascript using a Binary Heap.
 * Includes Binary Heap (with modifications) from Marijn Haverbeke.
 * http://eloquentjavascript.net/appendix2.html
 */

async function astarSearch(graph, startXY, endXY, options = {}) {
    // The graph caches data about the current search so it must be reset (and
    // also should not be used for multiple concurrent searches).
    graph.clean();

    const heuristic = nodeDistance;
    const startNode = graph.nodeAt(startXY[0], startXY[1]);
    const endNode = graph.nodeAt(endXY[0], endXY[1]);

    let openHeap = new BinaryHeap2((node) => {
        return node.estimate;
    });

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
            return pathTo(currentNode);
        }

        // About to visit all the neighbors, so move this to the closed "list"
        currentNode.closed = true;

        for (let neighbor of currentNode.neighbors(graph)) {
            // Not a valid node to process, skip to next neighbor.
            if (neighbor.closed) {
                continue;
            }
            if (!(neighbor.weight < Number.POSITIVE_INFINITY)) {
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
                neighbor.estimate = neighbor.cost + neighbor.remainder;

                if (!beenVisited) {
                    openHeap.push(neighbor);
                } else {
                    openHeap.rescoreElement(neighbor);
                }
            }
        }
    }

    return null;
}

function pathTo(node) {
    let curr = node;
    let path = [];
    while (curr.parent) {
        path.unshift(curr);
        curr = curr.parent;
    }
    return path;
}

/**
 * Note that cost are in "distance": so if there's a cost +5 to a particular edge,
 * that means the algorithm choose any alternate route of < 5 units of distance
 * to avoid that edge (assuming all other edges are cost 0).
 */
export class Graph2 {
    constructor(width, height, baseWeightFunc, edgeCostFunc) {
        this._baseWeightFunc = baseWeightFunc;
        this._edgeCostFunc = edgeCostFunc;
        this.nodes = new Array(width * height);
        this.width = width;
        this.height = height;

        let i = 0;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.nodes[i] = new GraphNode(x, y, baseWeightFunc(x, y));
                i++;
            }
        }
    }

    async pathfind(x0, y0, x1, y1) {
        this.clean();

        let path = await astarSearch(this, [x0, y0], [x1, y1], { closest: true });

        let list = [];
        if (path.length > 0) {
            list.push([x0, y0]);
            path.forEach((node) => {
                list.push([node.x, node.y]);
            });
        }
        return list;
    }

    nodeAt(x, y) {
        return this.nodes[y * this.width + x];
    }

    transitionCost(node0, node1) {
        // dist = the cost if not additional weighting
        // base = the cost of moving to that node, not matter what
        // edge = the cost of this particular transition
        const dist = nodeDistance(node0, node1);
        const base = this._baseWeightFunc(node1.weight);
        const edge = this._edgeCostFunc(node0, node1);

        // Avoid negative numbers since the algorithm will want to always visit those
        // to reduce the overall score, even though that's not the shortest path!
        return Math.max(0, dist + base + edge);
    }

    clean() {
        for (let i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clean();
        }

        // Reset the weights in case they changed
        let i = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                this.nodes[i].weight = this._baseWeightFunc(x, y);
                i++;
            }
        }
    }
}

function nodeDistance(node0, node1) {
    const dx = node1.x - node0.x;
    const dy = node1.y - node0.y;
    return Math.sqrt(dx * dx + dy * dy);
}

class GraphNode {
    constructor(x, y, weight) {
        this.x = x;
        this.y = y;
        this.weight = weight;
        this.clean();
    }

    clean() {
        this.estimate = 0;
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

// Not actually a binary heap!
class BinaryHeap2 {
    constructor(scoreFunction) {
        this._list = [];
        this._func = scoreFunction;
    }

    size() {
        return this._list.length;
    }

    push(elem) {
        this._list.push(elem);
        this._resort();
    }
    pop() {
        return this._list.shift();
    }
    remove(elem) {
        this._list = this._list.filter((e) => e !== elem);
    }

    rescoreElement(node) {
        this._resort();
    }

    _resort() {
        const f = this._func;
        this._list.sort((a, b) => f(a) - f(b));
    }
}
