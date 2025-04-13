/*
 *  typedef.d.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2023-04-21.
 *
 *  SYNOPSIS:
 *      Type definitions for Tmp3D.
 */

// -----------------------------------------------------------------------------
// globals
// -----------------------------------------------------------------------------
type pvec2_t = [number, number];
type pvec3_t = [number, number, number];
type pvec4_t = [number, number, number, number];
type pmat4_t = [pvec4_t, pvec4_t, pvec4_t, pvec4_t];
type bitmap_t = Uint8ClampedArray;
declare var __VERSION__: string;
declare var __DEBUG_MODE__: 1 | undefined;

// -----------------------------------------------------------------------------
// window
// -----------------------------------------------------------------------------
interface Window {
    __import__D_Mesh: typeof __import__D_Mesh;
    __import__D_Player: typeof __import__D_Player;
    __import__D_GlobTextures: typeof __import__D_GlobTextures;
    __import__A_Assets: typeof __import__A_Assets;
    __import__AN_Animation: typeof __import__AN_Animation;
    __import__I_Input: typeof __import__I_Input;
    __import__M_AABB3: typeof __import__M_AABB3;
    __import__M_Collision: typeof __import__M_Collision;
    __import__M_Mat4: typeof __import__M_Mat4;
    __import__M_Math: typeof __import__M_Math;
    __import__M_Tri3: typeof __import__M_Tri3;
    __import__M_Vec2: typeof __import__M_Vec2;
    __import__M_Vec3: typeof __import__M_Vec3;
    __import__R_Camera: typeof __import__R_Camera;
    __import__R_Draw: typeof __import__R_Draw;
    __import__R_Drawers: typeof __import__R_Drawers;
    __import__R_Geometry: typeof __import__R_Geometry;
    __import__R_Screen: typeof __import__R_Screen;
    __import__G_Const: typeof __import__G_Const;
    __import__G_Run: typeof __import__G_Run;
    __import__G_Setup: typeof __import__G_Setup;
}

// -----------------------------------------------------------------------------
// d_mesh.ts
// -----------------------------------------------------------------------------
type __Mod__D_Mesh = {
    D_Vertices (): pvec3_t[],
    D_UV (): pvec2_t[],
    D_Triangles (): pvec3_t[],
    D_UVMap (): uvface_t[],
    D_TextureAtlas (): { [textureId: string]: string },
};

declare function __import__D_Mesh (): __Mod__D_Mesh;

// -----------------------------------------------------------------------------
// data/d_player.ts
// -----------------------------------------------------------------------------
type __Mod__D_Player = { D_Velocity: number, D_Eye (): pvec3_t };
declare function __import__D_Player (): __Mod__D_Player;

// -----------------------------------------------------------------------------
// data/d_textures.ts
// -----------------------------------------------------------------------------
type D_GlobTextureIdTable = { [id: string]: string };
type D_GlobTextureFilenameTable = { [id: string]: string };

type __Mod__D_GlobTextures = {
    D_GlobTextureIdTable: D_GlobTextureIdTable,
    D_GlobTextureFilenameTable: D_GlobTextureFilenameTable,
};

declare function __import__D_GlobTextures (): __Mod__D_GlobTextures;

// -----------------------------------------------------------------------------
// engine/a_assets.ts
// -----------------------------------------------------------------------------
type texture_t = {
    id: string,
    bitmap: bitmap_t,
    width: number,
    height: number,
};

type __Mod__A_Assets = {
    A_LoadTextures
    ( ids: string[],
      filenames: string[],
      numTextures: number ): Promise<void[]>,
    A_Texture (id: string): texture_t,
};

declare function __import__A_Assets (): __Mod__A_Assets;

// -----------------------------------------------------------------------------
// engine/an_animation.ts
// -----------------------------------------------------------------------------
type OnFrame = (
    animationIndex: Uint32Array,
    id: string,
    onFrame: (animationIndex: number) => void,
    shouldEnd?: (animationIndex: number) => boolean,
    cleanUp?: () => void
) => void;

type animation_t = { onFrame: OnFrame, interval: number };
/* TODO: maybe find a better name for these table-types that is actually in line
 * with the general `<...>_t` naming scheme for types??
 */
type QueuedAnimationTable = { [id: string]: animation_t };
type RunningAnimationTable = { [id: string]: number };

type __Mod__AN_Animation = {
    AN_StartAnimation
    ( onFrame: (animationIndex: number) => void,
      interval: number,
      shouldEnd?: (animationIndex: number) => boolean,
      cleanUp?: () => void ): string,
    AN_CancelAnimation (id: string, cleanUp?: () => void): void,
    AN_QueueAnimation
    ( onFrame: (animationIndex: number) => void,
      interval: number,
      shouldEnd?: (animationIndex: number) => boolean,
      cleanUp?: () => void ): string,
    AN_RunQueuedAnimation (id: string): void,
};

declare function __import__AN_Animation (): __Mod__AN_Animation;

// -----------------------------------------------------------------------------
// engine/i_input.ts
// -----------------------------------------------------------------------------
type KEY = {
    RTN: "RTN",
    SPC: "SPC",
    ARW_DOWN: "ARW_DOWN",
    ARW_LEFT: "ARW_LEFT",
    ARW_RIGHT: "ARW_RIGHT",
    ARW_UP: "ARW_UP",
    A: "A",
    D: "D",
    E: "E",
    F: "F",
    G: "G",
    H: "H",
    L: "L",
    P: "P",
    Q: "Q",
    R: "R",
    S: "S",
    W: "W",
};

type MOUSE = {
    LEFT: "LEFT",
    MIDDLE: "MIDDLE",
    RIGHT: "RIGHT",
    BRWS_BWD: "BRWS_BWD",
    BRWS_FWD: "BRWS_FWD",
    MOVING: "MOVING",
    MOVEMENT_X: "MOVEMENT_X",
    MOVEMENT_Y: "MOVEMENT_Y",
    WHEELING: "WHEELING",
    DELTA_WHEEL: "DELTA_WHEEL",
};

type __Mod__I_Input = {
    I_Keys: { [key in (keyof KEY)]: key },
    I_Mouse: { [key in (keyof MOUSE)]: key },
    I_GetKeyState (key: keyof KEY): 0 | 1,
    I_InitKeyboard (onElement: Document | HTMLElement): void,
    I_GetMouseState (key: keyof MOUSE): number,
    I_InitMouse (onElement: HTMLElement): void,
};

declare function __import__I_Input (): __Mod__I_Input;

// -----------------------------------------------------------------------------
// engine/m_aabb.ts
// -----------------------------------------------------------------------------
type aabb3_t = Float32Array;

type __Mod__M_AABB3 = {
    M_AABB3 (origin3: vec3_t, dimensions3: vec3_t): aabb3_t
};

declare function __import__M_AABB3 (): __Mod__M_AABB3;

// -----------------------------------------------------------------------------
// engine/m_collision.ts
// -----------------------------------------------------------------------------
type __Mod__M_Collision = {
    M_LineVsLine2
    ( ax: number, ay: number,
      bx: number, by: number,
      cx: number, cy: number,
      dx: number, dy: number,
      segment?: 1 ): vec2_t | undefined,
    M_TimeBeforePlaneCollision3
    ( lineSrc: vec3_t, lineDest: vec3_t,
      planeRef: vec3_t, planeNormal: vec3_t ): number | undefined,
    M_LineSegmentVsPlaneCollision3
    ( lineSrc: vec3_t, lineDest: vec3_t,
      planeRef: vec3_t, planeNormal: vec3_t ): vec3_t | undefined,
    M_BoundingBoxVsBoundingBoxCollision3
    ( aabb0: aabb3_t,
      aabb1: aabb3_t ): boolean,
 };

 declare function __import__M_Collision (): __Mod__M_Collision;

// -----------------------------------------------------------------------------
// engine/m_vec2.ts
// -----------------------------------------------------------------------------
type vec2_t = Float32Array;

type __Mod__M_Vec2 = {
    M_Vec2 (x: number, y: number): vec2_t,
    M_Cross2 (u: vec2_t, v: vec2_t): number,
    M_Add2 (u: vec2_t, v: vec2_t): vec2_t,
    M_Sub2 (u: vec2_t, v: vec2_t): vec2_t,
    M_Scale2 (u: vec2_t, s: number): vec2_t,
};

declare function __import__M_Vec2 (): __Mod__M_Vec2;

// -----------------------------------------------------------------------------
// engine/m_vec3.ts
// -----------------------------------------------------------------------------
type vec3_t = Float32Array;
type vec4_t = Float32Array;

type __Mod__M_Vec3 = {
    M_Vec3 (x: number, y: number, z: number): vec3_t,
    M_Vec3FromVec4 (u: vec4_t): vec3_t,
    M_Dot3 (u: vec3_t, v: vec3_t): number,
    M_Cross3 (u: vec3_t, v: vec3_t): vec3_t,
    M_Add3 (u: vec3_t, v: vec3_t): vec3_t,
    M_Sub3 (u: vec3_t, v: vec3_t): vec3_t,
    M_Scale3 (u: vec3_t, s: number): vec3_t,
    M_Mag3 (u: vec3_t): number,
    M_Norm3 (u: vec3_t): vec3_t,
    M_Perp3 (vec: vec3_t, base: vec3_t): vec3_t,
    M_RotateAroundAxis3 (point: vec3_t, axis: vec3_t, angle: number): vec3_t,
    M_DistToPlane3
    ( vec: vec3_t,
      ref: vec3_t,
      normal: vec3_t,
      isAbs?: 1 ): number,
    M_IsInFrontOfPlane3 (vec: vec3_t, ref: vec3_t, normal: vec3_t): boolean,
};

declare function __import__M_Vec3 (): __Mod__M_Vec3;

// -----------------------------------------------------------------------------
// engine/m_mat4.ts
// -----------------------------------------------------------------------------
type mat4_t = Float32Array;

type __Mod__M_Mat4 = {
    M_Vec4FromVec3 (u: pvec3_t | vec3_t, w: number): vec4_t,
    M_Mat4 (x: vec4_t, y: vec4_t, z: vec4_t, w: vec4_t): mat4_t,
    M_QuickInv4 (mat: mat4_t): mat4_t,
    M_Transform4 (mat: mat4_t, vec: vec4_t): vec4_t,
};

declare function __import__M_Mat4 (): __Mod__M_Mat4;

// -----------------------------------------------------------------------------
// engine/m_math.ts
// -----------------------------------------------------------------------------
type __Mod__M_Math = {
    PI_2: number,
    M_RadToDeg (radian: number): number,
    M_Clamp (number: number, lower: number, upper: number): number,
    M_ToFixedDigits (number: number, nDigits: number): number,
    M_FastSign (number: number): number,
};

declare function __import__M_Math (): __Mod__M_Math;

// -----------------------------------------------------------------------------
// engine/m_tri3.ts
// -----------------------------------------------------------------------------
type tri3_t = [vec3_t, vec3_t, vec3_t];

type __Mod__M_Tri3 = {
    M_Tri3 (a3: vec3_t, b3: vec3_t, c3: vec3_t): tri3_t,
    M_TriNormal3 (tri3: tri3_t): vec3_t,
    M_TransformTri3 (transform4: mat4_t, tri3: tri3_t): tri3_t,
    M_AABB3FromTri3 (tri3: tri3_t): aabb3_t,
    M_RotateTriAroundAxis3 (tri3: tri3_t, axis3: vec3_t, angle: number): tri3_t,
};

declare function __import__M_Tri3 (): __Mod__M_Tri3;

// -----------------------------------------------------------------------------
// engine/r_camera.ts
// -----------------------------------------------------------------------------
type cam3_t = {
    x: number,
    y: number,
    z: number,
    fwdX: number,
    fwdY: number,
    fwdZ: number,
};

type __Mod__R_Camera = {
    R_Origin: vec3_t,
    R_Right: vec3_t,
    R_Down: vec3_t,
    R_Fwd: vec3_t,
    R_InitCamera
    ( fovy: number,
      aspect: number,
      zNear: number,
      zFar: number,
      eye: pvec3_t,
      velocity: number ): void,
    R_UpdateCamera (mult: number): void,
    R_GetCameraState (): cam3_t,
    R_GetProjectionOrigin (): vec3_t,
    R_TriToWorldSpace (triangle: tri3_t): tri3_t,
    R_TriToViewSpace (triangle: tri3_t): tri3_t,
    R_TriToClipSpace (triangle: tri3_t): tri3_t,
    R_VecToViewSpace (vec: vec3_t): vec3_t,
    R_VecToClipSpace (vec: vec3_t): vec3_t,
    R_DebugStats (deltaT: number, nTrisOnScreen: Uint32Array): void,
};

declare function __import__R_Camera (): __Mod__R_Camera;

// -----------------------------------------------------------------------------
// engine/r_draw.ts
// -----------------------------------------------------------------------------
type __Mod__R_Draw = {
    R_InitFrameBuffer (): void,
    R_InitZBuffer (): void,
    R_FlushFrame (): void,
    R_FillRect
    ( x: number, y: number,
      w: number, h: number,
      r: number, g: number, b: number, a: number ): void,
    R_DrawLine
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void,
    R_DrawLine_DDA
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void,
    R_DrawLine_RayCast
    ( sx: number, sy: number,
      dx: number, dy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void,
    R_DrawCircle
    ( x: number, y: number,
      rad: number,
      r: number, g: number, b: number, a: number ): void,
    R_DrawTriangle_Wireframe
    ( ax: number, ay: number,
      bx: number, by: number,
      cx: number, cy: number,
      r: number, g: number, b: number, a: number,
      stroke: number ): void,
    R_FillTriangle_Colored (vso: vso_t, pso: pso_t): void,
    /* TODO: uncomment these once they are implemented */
    // R_FillTriangle_Colored_Bresenham
    // ( ax: number, ay: number,
    //   bx: number, by: number,
    //   cx: number, cy: number,
    //   r: number, g: number, b: number, a: number ): void,
    // R_FillTriangle_Textured_Affine
    // ( tex: texture_t,
    //   ax: number, ay: number,
    //   bx: number, by: number,
    //   cx: number, cy: number,
    //   au: number, av: number,
    //   bu: number, bv: number,
    //   cu: number, cv: number,
    //   alpha: number,
    //   lightLevel: number ): void,
    R_FillTriangle_Textured_Perspective (vso: vso_t, pso: pso_t): void,
    R_DrawImage
    ( img: texture_t,
      sx: number, sy: number,
      sw: number, sh: number,
      dx: number, dy: number,
      dw: number, dh: number,
      alpha?: number,
      lightLevel?: number ): void,
    R_Print
    ( chars: string,
      x: number, y: number,
      color?: string,
      size?: number,
      fontFamily?: string,
      style?: string ): void,
};

declare function __import__R_Draw (): __Mod__R_Draw;

// -----------------------------------------------------------------------------
// engine/r_drawers.ts
// -----------------------------------------------------------------------------
type __Mod__R_Drawers = {
    R_LoadingDrawer (onEnd?: () => void): string,
    R_TitleDrawer (decor: texture_t, onEnd?: () => void): string,
    R_ErrorDrawer (reason: string): void,
    R_PrintOnScreenMessage (): void,
    R_SetOnScreenMessage (msg: string, ticks: number): void,
};

declare function __import__R_Drawers (): __Mod__R_Drawers;

// -----------------------------------------------------------------------------
// engine/r_geometry.ts
// -----------------------------------------------------------------------------
type uvface_t = { a: number, b: number, c: number, textureId: string };

type __Mod__R_Geometry = {
    R_ToggleGlobalRotation (): void,
    R_LoadGeometry
    ( vertices: pvec3_t[], nVertices: number,
      triangles: pvec3_t[], nTriangles: number ): void,
    R_InitUVTable
    ( vertices: pvec2_t[],
      triangles: uvface_t[],
      nTriangles: number ): void,
    R_UpdateWorld (): void,
    R_RenderGeometries (nTrisOnScreen: Uint32Array): void,
    R_RenderLine
    ( src: vec3_t, dest: vec3_t,
      r: number, g: number, b: number, a: number,
      stroke: number ): void,
    R_Tris (): tri3_t[],
};

declare function __import__R_Geometry (): __Mod__R_Geometry;

// -----------------------------------------------------------------------------
// engine/r_light.ts
// -----------------------------------------------------------------------------
type __Mod__R_Light = { R_UpdateLight (pso: pso_t): void };
declare function __import__R_Light (): __Mod__R_Light;

// -----------------------------------------------------------------------------
// engine/r_screen.ts
// -----------------------------------------------------------------------------
type __Mod__R_Screen = {
    R_ScreenElement: HTMLCanvasElement,
    R_Ctx: CanvasRenderingContext2D,
    R_FlushBuffer (buffer: ImageData): void,
    R_InitBuffer (w: number, h: number): ImageData,
};

declare function __import__R_Screen (): __Mod__R_Screen;

// -----------------------------------------------------------------------------
// engine/r_shader.ts
// -----------------------------------------------------------------------------
type vso_t = {
    ax: number, ay: number, aw: number,
    bx: number, by: number, bw: number,
    cx: number, cy: number, cw: number,
    ar: number, ag: number, ab: number,
    br: number, bg: number, bb: number,
    cr: number, cg: number, cb: number,
    au: number, av: number,
    bu: number, bv: number,
    cu: number, cv: number,
    nax: number, nay: number, naz: number,
    nbx: number, nby: number, nbz: number,
    ncx: number, ncy: number, ncz: number,
    wax: number, way: number, waz: number,
    wbx: number, wby: number, wbz: number,
    wcx: number, wcy: number, wcz: number,
};

type pso_t = {
    mode: number,
    tex?: texture_t,
    dy: number,
    dx0: number, dx1: number,
    w0: number, w1: number,
    r0: number, g0: number, b0: number, r1: number, g1: number, b1: number,
    u0: number, v0: number, u1: number, v1: number,
    nx0: number, ny0: number, nz0: number,
    nx1: number, ny1: number, nz1: number,
    wx0: number, wy0: number, wz0: number,
    wx1: number, wy1: number, wz1: number,
    normalX?: number, normalY?: number, normalZ?: number,
    lightX?: number, lightY?: number, lightZ?: number,
    isPointLight: number,
    alpha: number,
};

type __Mod__R_Shader = {
    R_VertexShaderObj: vso_t,
    R_PixelShaderObj: pso_t,
    R_ShaderMode_Wireframe: number,
    R_ShaderMode_Fill: number,
    R_ShaderMode_Texture: number,
    R_ShaderMode_Lights: number,
    R_ShaderMode_Smooth: number,
    R_ShaderMode_Specular: number,
    R_ShaderMode_PointLight: number,
    R_ToggleWireframe (): void,
    R_ChangeFillMode (): void,
    R_ChangeLightingMode (): void,
    R_TogglePointLight (): void,
    R_ToggleSpecularHighlights (): void,
};

declare function __import__R_Shader (): __Mod__R_Shader;

// -----------------------------------------------------------------------------
// game/g_const.ts
// -----------------------------------------------------------------------------
type __Mod__G_Const = {
    FPS: number,
    FOV_X: number,
    FOV_Y: number,
    MAX_MOV_TILT: number,
    SCREEN_W: number,
    SCREEN_H: number,
    SCREEN_W_2: number,
    SCREEN_H_2: number,
    ASPECT: number,
    Z_NEAR: number,
    Z_FAR: number,
    FRUSTUM_AABB3: aabb3_t,
};

declare function __import__G_Const (): __Mod__G_Const;

// -----------------------------------------------------------------------------
// game/g_run.ts
// -----------------------------------------------------------------------------
type __Mod__G_Run = { G_Run (setupResolution?: setup_resolution_t): void };
declare function __import__G_Run (): __Mod__G_Run;

// -----------------------------------------------------------------------------
// game/g_setup.ts
// -----------------------------------------------------------------------------
type setup_resolution_t = { loadingId: string };
type __Mod__G_Setup = { G_Setup (): Promise<setup_resolution_t | undefined> };
declare function __import__G_Setup (): __Mod__G_Setup;
