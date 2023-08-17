# Unsorted

## Debugging-aid

- [x] Draw axes
- [ ] Draw surface & vertex normals

## Feature-wise

- [x] Camera transformations w/ 2 degrees-of-freedom (yaw and pitch)
- [x] Perspective transformation
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
    - [x] Diffuse lighting
    - [ ] Specular reflections

- [ ] Texture-mapping
    - [ ] Affine
    - [x] Perspective-correct
- [ ] Occlusion culling (😩)
- [ ] Functionality for dynamically (re)loading mesh data (should go to server?)

## Primitives

- [x] Rectangles
- [x] Lines
- [x] Triangles
- [X] Circles

## Project Organization

- [x] `README.md`
- [x] File descriptions
- [x] `CONVENTIONS`
- [x] Migrate to TypeScript
- [ ] Decoupling? Inspiration from `OLC_PixelGameEngine`, or
      `OLC_ConsoleGameEngine`, or OpenGL shading pipeline?

# Tentative Backlog

### release: 0.0.4
- [x] Loading Wavefront `.obj` files

### release: 0.0.5
- [x] Z-buffering

### release: 0.0.6
- [x] Clipping geometries against the view frustum (Against the near-plane
      specifically for the time being)
- #### release 0.0.6.1
    - [x] Migrate the engine to TypeScript 🎉

### release: 0.0.7
- [x] Crude frustum-culling
- [x] Diffuse lighting

### release: 0.0.8
- [ ] Point light(s)
- [ ] The complete Phong Reflection Model
    - [x] Ambient
    - [x] Diffuse
    - [ ] Specular

### release: 0.0.9
- [ ] Fix the oscillation in the frametimes

### release: 0.0.x
- [ ] Occlusion-culling
