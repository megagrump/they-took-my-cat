# They took my cat

An [entry to the JS13K 2025](https://js13kgames.com/2025/games/they-took-my-cat) competition, inspired by the classic arcade game [Elevator Action](https://en.wikipedia.org/wiki/Elevator_Action).

An evil society of animal snatchers stole your cat! Search their headquarters for Manny the cat and fight animal thieves along the way.

![screenshot](scrshot.png)

## Post-competition version

The game was updated after the competition. Some bugs were fixed, and the control scheme was improved after player feedback during the competition. This version doesn't necessarily fit in a 13 KiB file anymore.

The update version can be played directly in your desktop browser [here](https://megagrump.github.io/they-took-my-cat/).

Or you can play the [original compo version here](https://js13kgames.com/2025/games/they-took-my-cat).

## Controls

Move around using arrow keys/WASD:<br>
Left/right to walk/turn<br>
Up/down to use doors and stairs, and control elevators<br>
C/LeftCtrl to crouch<br>
Space/X to shoot<br>

## Technical

Made for desktop browsers. Tested to work in Firefox, Chromium, and WebKitGTK. Performs best in Firefox. Safari and other browsers are untested.

The game generates ~730 images and animations, several sound effects, and ~4 minutes of music at load time.

Rendering is done with WebGL2. A simplified deferred shading approach is used to render the world, which contains ~160 dynamic light sources. Materials only have one property besides the texture: a specular exponent value, stored in the blue channel of the generated normal maps.

## Not for redistribution

The source code is provided for educational purposes only.
