<p align="center">
    <img src="https://raw.githubusercontent.com/emre-aki/tmp3d/master/.images/tmp3d_2x.png">
    </img>
    <br>
    <a href="https://undefbehav.itch.io/tmp3d" target="_blank">itch.io</a>
    •
    <a href="https://emre-aki.github.io/tmp3d/" target="_blank">
        Play in the browser
    </a>
    •
    <a href="https://www.youtube.com/watch?v=r31ziBZT98k&list=PLmmhlHT3LkQx-cADfV5HChiBPVYwCbYuf"
       target="_blank">
        Feature showcases
    </a>
</p>
<p align="center">
    <img width="320"
         height="240"
         src="https://media1.giphy.com/media/BOFXBO58mR5kGgnw8m/giphy.gif">
    </img>
    <img width="320"
         height="240"
         src="https://media1.giphy.com/media/5drzSiNyoLsoTzyyKg/giphy.gif">
    </img>
    <img width="320"
         height="240"
         src="https://media1.giphy.com/media/RBdPyEGdwFZwkbMSu0/giphy.gif">
    </img>
    <img width="320"
         height="240"
         src="https://media1.giphy.com/media/nwioIaZNYJTTkOXDGO/giphy.gif">
    </img>
    <img width="320"
         height="240"
         src="https://media1.giphy.com/media/bSlge1Ee52ncGgwcpx/giphy.gif">
    </img>
    <img width="320"
         height="240"
         src="https://media1.giphy.com/media/6Z9fe1ckUyGCZuBPOQ/giphy.gif">
    </img>
</p>

Tmp3D is a 3-D software renderer written from scratch in nothing but plain-old
JavaScript, just for kicks. It makes use of the `2d` graphics context of the
HTML5 `<canvas>` to draw some graphics primitives and is heavily inspired by
OpenGL sub-routines.

The project is still heavily a work-in-progress and in its very early stages, so
you may take it as it is and expect many more features to follow very soon.

Tmp3D currently supports

  - a first-person camera with _5_ degrees-of-freedom: translating along _x_,
    _y_ & _z_ axes, and _yaw_ & _pitch_
  - perspective transformations
  - back-face culling
  - AABB-based, crude frustum-culling
  - raster-clipping
  - clipping against the near-clipping plane
  - flat-shading w/ directional lights
  - perspective-correct texture-mapping
  - loading & rendering 3-D models in the [Wavefront `.obj` format](https://en.wikipedia.org/wiki/Wavefront_.obj_file)
  - depth-buffering & depth-sorting

and plans to support

  - Phong reflection model
  - affine texture-mapping
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

Finally, open up your browser of choice and go to
[127.0.0.1:3000](https://127.0.0.1:3000).

### Loading `.obj` models

To load `.obj` models into Tmp3D in a format that the engine can operate on,
you may use the integrated CLI tool:

```bash
$ npm run load-obj path/to/obj
```

If your `.obj` model has a reference to a material library, you can load that as
well, by passing the path to it in an optional argument with `--material`, or
`-m`:

```bash
$ npm run load-obj path/to/obj -- -m path/to/mtl
```

You may optionally offset the model by translating it along the z-axis by a
certain amount:

```bash
$ npm run load-obj path/to/obj -- -z 100
```

To view the full list of arguments, you may run:

```bash
$ npm run load-obj -- -h
```

Once loaded, refresh the page to view your model in 3D!

> ⚠️ *Tmp3D can process and render only triangles at this point in time, so
please make sure your source geometries consist strictly of triangles--the CLI
will reject it otherwise.*

### Controls

| **Action**                     | **Keys**                                                                          |
|--------------------------------|-----------------------------------------------------------------------------------|
| Movement                       | <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>                               |
| Free-look                      | <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd> <kbd>←</kbd>, or the mouse<sup>__*__</sup> |
| Change elevation               | <kbd>Q</kbd> <kbd>E</kbd>, or <kbd>![MSW]</kbd><sup>__*__</sup>                   |
| Switch between rendering modes | <kbd>R</kbd>                                                                      |

> ⚠️ *<sup>__\*__</sup> You should first click <kbd>![LMB]</kbd> on the `canvas` to
  activate mouse controls.*

### Live Demo

You can check out the live demo [here](https://emre-aki.github.io/tmp3d/)!

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
