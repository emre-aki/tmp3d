# Unsorted

## Debugging-aid

- [x] Draw axes

## Feature-wise

- [x] Camera transformations w/ 2 degrees-of-freedom (yaw and pitch)
- [x] Perspective transformation
- [x] Graphic primitives
    - [x] Rectangles
    - [x] Lines
    - [x] Triangles
- [x] Back-face culling
- [ ] Frustum culling, i.e., triangle clipping
- [x] Flat-shading
- [ ] Texture-mapping
    - [ ] Affine
    - [x] Perspective-correct
- [ ] Occlusion culling (😩)
- [ ] Functionality for dynamically (re)loading mesh data (should go to server?)

## Project Organization

- [x] `README.md`
- [x] File descriptions
- [x] `CONVENTIONS`
- [ ] Decoupling? Inspiration from `OLC_PixelGameEngine`, or `OLC_ConsoleGameEngine`?

# Tentative Backlog

### release: 0.0.4
- [x] Loading Wavefront `.obj` files

### release: 0.0.5
- [ ] Z-buffering

### release: 0.0.6
- [ ] Clipping geometries against the view frustum

### release: 0.0.7
- [ ] Fix the oscillation in the frametimes
