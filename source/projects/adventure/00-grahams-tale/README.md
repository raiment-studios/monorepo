# Graham's Quest


## TODO

* [ ] Load forest from Card asset
* [ ] Allow Forest to be edited in game
* [ ] Add menu
* [ ] Add random seed
* [ ] Add text


Simplifications

* A single Region (Galthea)
* Each area is a fixed rectangular size


### Plot

Adapted from [King's Quest I](http://gamerwalkthroughs.com/kings-quest-1/)

* Kestrel awakes in an Area with a Castle in it
* There's a King Graham there
* Graham will describe Tristan's disappearance & the increasingly dramatic effects of the maelstrom on the world
* There's a rock in the area which has a "Push" interaction. If it is pushed, there will be hole uncovered with a Key below it.
* There's a Library in the forest with an "Enter" interaction. You need the key to enter.
* The Library contains a Book which describe the location of Tristan's Cave.  This forces a new Area to be placed where Tristan's Cave will be located.  This card cannot be played until the Book is read.
* There's a Forest Area to the north.  It has a Cave Location. This is Tristan's Cave. 
* Enter the Cave. This is a new Area. Tristan's shell is there. The game ends. Kestrel has found Tristant

Todo
* [ ] The maelstrom should be involved somehow


### Features

The game itself is defined as a particular "game" asset: this defines the deck to use (i.e. what assets are in play) and the starting card (set starting conditions). The notion of multiple "games" makes it easier to set up test scenarios focused on specifics.

A major motivation for Raiment is ease of contribution: the default mode is "game mode" and that should be immersive, but it is possible to edit and replay cards during the actual game, thus making playing and improving the game a somewhat fluid, single experience.

