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
- [x] Raster-clipping
- [ ] Culling & clipping based on the view space
    - [ ] Frustum-culling
        - [x] Crude (AABB vs. AABB)
        - [ ] Smart (some other more optimized technique)
    - [ ] Clipping geometries against the view frustum
        - [x] Clipping against the near-plane
        - [ ] Clipping against the far-plane
        - [ ] Clipping against other planes? (Or would raster-clipping be
              enough?)
- [x] Flat-shading
- [ ] Phong reflection model
    - [x] Ambient lighting
    - [ ] Diffuse shading
    - [ ] Specular lighting

- [ ] Texture-mapping
    - [ ] Affine
    - [x] Perspective-correct
- [ ] Occlusion culling (😩)
- [ ] Functionality for dynamically (re)loading mesh data (should go to server?)

## Project Organization

- [x] `README.md`
- [x] File descriptions
- [x] `CONVENTIONS`
- [ ] Decoupling? Inspiration from `OLC_PixelGameEngine`, or
      `OLC_ConsoleGameEngine`?

# Tentative Backlog

### release: 0.0.4
- [x] Loading Wavefront `.obj` files

### release: 0.0.5
- [x] Z-buffering

### release: 0.0.6
- [x] Clipping geometries against the view frustum (Against the near-plane
      specifically for the time being)

### release: 0.0.7
- [x] Crude frustum-culling
- [ ] Diffuse-shading

### release: 0.0.8
- [ ] Fix the oscillation in the frametimes

### release: 0.0.x
- [ ] Occlusion-culling
