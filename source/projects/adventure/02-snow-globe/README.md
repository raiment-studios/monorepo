# Snow Globe

[![](https://img.shields.io/badge/feedback-welcome!-1a6)](https://github.com/raiment-studios/monorepo/discussions)

A single region voxel game where the adventure plays out in a limited space that is constantly changing. Focus is on storytelling and game mechanics (versus infinite world exploration!).

https://user-images.githubusercontent.com/65878718/170372456-bcc4c35b-0521-440f-bb71-36132f727e0e.mp4

## Getting started

🚧 TODO

## Vision

A short, but fully finished game set in the world of Kestrel. Confined to a 256x256 voxel location, as the game progresses, that [location modifies itself](https://twitter.com/RidleyWinters/status/1528219337659600896). The sequence of events is fairly linear.

_Target Launch Announcement_

> Snow Globe is a new, fun to play adventure game released by [Raiment Studios](https://raiment-studios.github.io/). You play the part of Kestrel, an android awoken in the mysterious world of Galthea where she seeks to find Tristan, her creator. As Kestrel, you explore the ever-changing world and interact with characters, discover artifacts from the world's veiled history, and complete the adventure in a beautiful, interactive world.
>
> The game mixes the classic feel of old school adventure games in a cleverly designed, voxel-based art style. The story and the world dynamically evolve uniquely in each playthrough creating a novel experience every time. The world of Galthea presents the player with a peaceful, low-stress in which to fulfill Kestrel's quest.
>
> `Kestrel: Snow Globe` is completely free and takes about 30 minutes to play end-to-end. Elements of procedural design give the game replay value to uncover different endings and different paths along with to explore the world of Galthea.
>
> This is Raiment Studios' first game release centered around the world of Kestrel. The game is open source, including the content and worldbuilding material. Raiment Studios is encouraging reuse and contributions to their projects.

## User documentation

🚧 TODO

## Roadmap

### 🏁 v1.0 Checkpoints

-   [ ] Basic functionality
    -   [x] ["Launch Annoucement" in advance](https://www.productplan.com/glossary/working-backward-amazon-method/)
    -   [ ] Basic storyline
    -   [x] Character sprite
    -   [ ] NPCs
    -   [ ] Castle model
    -   [ ] Basic UI dialogs
    -   [ ] Music
    -   [ ] Ambient sound
    -   [ ] Menu screen
-   [ ] Simulation
    -   [ ] Farmers in farmland region
-   [ ] TODO
    -   [ ] TODO
    -   [ ] TODO
    -   [ ] TODO
    -   [ ] TODO

### 🎄 Backlog

-   [ ] TODO
-   [ ] TODO
-   [ ] TODO

## Design

### Basic game flow & core mechanics

Core mechanics: different starting character traits for Kestrel. Different character traits derived from allegiances and histories in NPCs. Character interactions use a "lock & key" mechnaism to give Kestrel next steps in getting closer to Tristan. Each major "unlock" generally transforms the 256x256 area into a new area with new conditions (trees, water, rain, hills & mountains, objects, sky).

The gameplay internally creates a graph of nodes where each transition has possibilities determined by the character traits, relationships, and histories. Procedurally generated circumstances, scenarios, and challenges dynamically create the nodes along the story evolution - not in advance - but "on-demand" so the story-line is not known until actions are taken ("reverse twenty questions" style). The end node is always the discovery of Tristan: but this can play out in several different ways.

The enjoyment of the game is in seeing a different story with different characters, scenery, and conclusions play out.

1.  Kestrel starts in an open field with a path leading north (L&K = move north)
2.  When she moves to the end of the path, the world transforms & rotates (introducing the notion of the dynamic world )
3.  She gets to a cabin in the forest
4.  When she interacts with this, a pop-up storyline appears. It is Logan's cabin. She must make a choice.

## FAQ

🚧 TODO
