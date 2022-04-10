# Regions

Regions define a fully contiguous portion of the world that generally are composed of a uniform political and geographical theme.

## City-states

Regions can generate a city-states.

A region without any city-states is a special-case that mostly wilderness and does not have a common political anchor.

Most regions have a single city-state. This the political center of the region. This fits with the overall world of Galathea where city-states are separated both in distance and culture.

A few more populated regions may have several city-states. These city-states should share the same politics and culture. One of the city-states should be the dominant one with the others being smaller.

## Culture & Politics

Culture and politics are generally defined by splitting the population into three categories of denizens:

-   55%- 80% majority faction
-   20%-40% minority faction
-   5%-10% outliers

Aesthetically, factions are given a distinct color palette composed a primary, secondary, and highlight color. Clothes, uniforms, buildings, etc. should use variations of this palette. In the fictional world of Galthea, this gives the player an immediate hint of a cultural and political leanings for characters and places. Of course, there may be exceptions to this: the exception should be rare and thus interesting.

Outliers should borrow from factions defined in other regions and usually represent an expatriot. Characters who are outliers generally face prejudice in most city-states.

## Geography

In generating regions, the basic algorithm:

-   Generate a contiguous, 2d shape that is can be either convex or concave (something akin to [blobmaker](https://www.blobmaker.app/))
-   Overlay that region on the existing set of regions, retaining an ordered list in which they were added
-   When determining what region a particular point in the world belongs to, the point belongs to the _first_ region in the list that contains that point

This "overlay" model may produce discontiguous regions when looking at the world as a whole.

![image](https://user-images.githubusercontent.com/65878718/162629918-4112f84e-b806-47e1-be6c-e485d0db1d32.png)

## Additional notes

#### Cultural boundaries

The Regions have distinct boundary lines. The politics and culture _do_ change right on that line. In the fictional world, this exaggerated change by design.
