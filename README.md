<p align="center">
    <img
        src="https://raw.githubusercontent.com/emre-aki/tmp3d/master/.images/tmp3d_2x.png">
    </img>
    <br>
    <img src="https://media2.giphy.com/media/0cy6jQpqXaNd5rFZiZ/giphy.gif">
    </img>
    <br>
    <a href="https://undefbehav.itch.io/tmp3d" target="_blank">itch.io</a>
    •
    <a href="https://tmp3d.herokuapp.com" target="_blank">
        Play in the browser
    </a>
</p>

Tmp3D is a 3-D software rasterizer written from scratch in nothing but plain-old
JavaScript, just for kicks. It makes use of the `2d` graphics context of the
HTML5 `<canvas>` to draw some graphics primitives and is heavily inspired by
OpenGL sub-routines.

The project is still heavily a work-in-progress and in its very early stages, so
you may take it as it is and expect many more features to follow very soon.

It currently supports

  - a first-person camera with 2 degrees-of-freedom: _yaw_ and _pitch_
  - perspective transformations
  - near & far clipping planes
  - back-face culling
  - flat-shading

and plans to support

  - frustum culling, i.e., triangle clipping
  - depth-sorting
  - affine & perspective-correct texture-mapping
  - occlusion culling (😩)

### Why?

My main motive for undertaking this project was that it'd be educational,
recreational, and entertaining. I may or may not try and make a game with it at
some point if I'm satisfied with its progress. So, the fact of the matter is,
[have some fun while re-inventing the wheel](https://youtu.be/WniZwxGA_-s).

### Setting up

#### Requirements

- Node.js
- `ejs`
- `express`

After cloning the repository, navigate to the root folder and install the
dependencies using `npm`.

```bash
$ npm install
```

Once all the dependencies are installed, you can start up an Express development
server with:

```bash
$ npm run start
```

To enable the debugging features, run:

```bash
$ npm run start:debug
```

### Controls

| **Action**             | **Keys**                                                                          |
|------------------------|-----------------------------------------------------------------------------------|
| Movement               | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>                               |
| Free-look              | <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> <kbd>←</kbd>, or the mouse<sup>__*__</sup> |
| Change elevation       | <kbd>Q</kbd> <kbd>E</kbd>, or <kbd>![MSW]</kbd><sup>__*__</sup>                   |

  *<sup>__\*__</sup> You should first click <kbd>![LMB]</kbd> on the `canvas` to
  activate mouse controls.*

### Live Demo

You can check out the live demo [here](https://tmp3d.herokuapp.com)!

### Trivia

The project is named after the fact that I'm too lazy to come up with an
original name, so I make up a placeholder name to keep me going until the
first-ever public release of the project, by which time I had already grown
accustomed to the placeholder name and it's too late to come up with a new name,
so I decide to go with it thinking I can pretend it is a deliberate choice of a
name so I can make some silly _backronyms_ with it.

<p align="center">
    <a href="https://github.com/emre-aki/tmp3d/blob/master/CONVENTIONS"
       target="_blank">
        Conventions
    </a>
    •
    <a href="https://github.com/emre-aki/tmp3d/blob/master/FILES"
       target="_blank">
        File descriptions
    </a>
    •
    <a href="https://github.com/emre-aki/tmp3d/blob/master/TODO.md"
       target="_blank">
        To-do
    </a>
</p>

[LMB]: https://raw.githubusercontent.com/emre-aki/tmp3d/master/.images/lmb.png (left mouse button)
[MSW]: https://raw.githubusercontent.com/emre-aki/tmp3d/master/.images/msw.png (mouse scroll whell)
