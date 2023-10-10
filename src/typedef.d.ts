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
type D_Vertices = () => pvec3_t[];
type D_UV = () => pvec2_t[];
type D_Triangles = () => pvec3_t[];
type D_UVMap = () => uvface_t[];
type D_TextureAtlas = () => { [textureId: string]: string };

type __Mod__D_Mesh = {
    D_Vertices: D_Vertices,
    D_UV: D_UV,
    D_Triangles: D_Triangles,
    D_UVMap: D_UVMap,
    D_TextureAtlas: D_TextureAtlas,
};

declare function __import__D_Mesh (): __Mod__D_Mesh;

// -----------------------------------------------------------------------------
// data/d_player.ts
// -----------------------------------------------------------------------------
type D_Eye = () => pvec3_t;
type __Mod__D_Player = { D_Velocity: number, D_Eye: D_Eye };
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

type A_LoadTextures = (
    ids: string[],
    filenames: string[],
    numTextures: number
) => Promise<void[]>;

type A_Texture = (id: string) => texture_t;

type __Mod__A_Assets = {
    A_LoadTextures: A_LoadTextures,
    A_Texture: A_Texture,
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

type AN_StartAnimation = (
    onFrame: (animationIndex: number) => void,
    interval: number,
    shouldEnd?: (animationIndex: number) => boolean,
    cleanUp?: () => void
) => string;

type AN_CancelAnimation = (id: string, cleanUp?: () => void) => void;

type AN_QueueAnimation = (
    onFrame: (animationIndex: number) => void,
    interval: number,
    shouldEnd?: (animationIndex: number) => boolean,
    cleanUp?: () => void
) => string;

type AN_RunQueuedAnimation = (id: string) => void;

type __Mod__AN_Animation = {
    AN_StartAnimation: AN_StartAnimation,
    AN_CancelAnimation: AN_CancelAnimation,
    AN_QueueAnimation: AN_QueueAnimation,
    AN_RunQueuedAnimation: AN_RunQueuedAnimation,
};

declare function __import__AN_Animation (): __Mod__AN_Animation;

// -----------------------------------------------------------------------------
// engine/i_input.ts
// -----------------------------------------------------------------------------
type KEY = {
    A: "A",
    D: "D",
    E: "E",
    G: "G",
    Q: "Q",
    R: "R",
    S: "S",
    W: "W",
    ARW_DOWN: "ARW_DOWN",
    ARW_LEFT: "ARW_LEFT",
    ARW_RIGHT: "ARW_RIGHT",
    ARW_UP: "ARW_UP",
    RTN: "RTN",
    SPC: "SPC",
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

type I_GetKeyState = (key: keyof KEY) => 0 | 1;
type I_InitKeyboard = (onElement: Document | HTMLElement) => void;
type I_GetMouseState = (key: keyof MOUSE) => number;
type I_InitMouse = (onElement: HTMLElement) => void;

type __Mod__I_Input = {
    I_Keys: { [key in (keyof KEY)]: key },
    I_Mouse: { [key in (keyof MOUSE)]: key},
    I_GetKeyState: I_GetKeyState,
    I_InitKeyboard: I_InitKeyboard,
    I_GetMouseState: I_GetMouseState,
    I_InitMouse: I_InitMouse,
};

declare function __import__I_Input (): __Mod__I_Input;

// -----------------------------------------------------------------------------
// engine/m_aabb.ts
// -----------------------------------------------------------------------------
type aabb3_t = Float32Array;
type M_AABB3 = (origin3: vec3_t, dimensions3: vec3_t) => aabb3_t;
type __Mod__M_AABB3 = { M_AABB3: M_AABB3 };
declare function __import__M_AABB3 (): __Mod__M_AABB3;

// -----------------------------------------------------------------------------
// engine/m_collision.ts
// -----------------------------------------------------------------------------
type M_TimeBeforePlaneCollision3 = (
    lineSrc: vec3_t, lineDest: vec3_t,
    planeRef: vec3_t, planeNormal: vec3_t
) => number | undefined;

type M_LineSegmentVsPlaneCollision3 = (
    lineSrc: vec3_t, lineDest: vec3_t,
    planeRef: vec3_t, planeNormal: vec3_t
) => vec3_t | undefined;

type M_BoundingBoxVsBoundingBoxCollision3 = (
    aabb0: aabb3_t,
    aabb1: aabb3_t
) => boolean;

type __Mod__M_Collision = {
    M_TimeBeforePlaneCollision3: M_TimeBeforePlaneCollision3,
    M_LineSegmentVsPlaneCollision3: M_LineSegmentVsPlaneCollision3,
    M_BoundingBoxVsBoundingBoxCollision3: M_BoundingBoxVsBoundingBoxCollision3,
 };

 declare function __import__M_Collision (): __Mod__M_Collision;

// -----------------------------------------------------------------------------
// engine/m_vec2.ts
// -----------------------------------------------------------------------------
type vec2_t = Float32Array;
type M_Vec2 = (x: number, y: number) => vec2_t;
type M_Cross2 = (u: vec2_t, v: vec2_t) => number;
type M_Add2 = (u: vec2_t, v: vec2_t) => vec2_t;
type M_Sub2 = (u: vec2_t, v: vec2_t) => vec2_t;
type M_Scale2 = (u: vec2_t, s: number) => vec2_t;

type __Mod__M_Vec2 = {
    M_Vec2: M_Vec2,
    M_Cross2: M_Cross2,
    M_Add2: M_Add2,
    M_Sub2: M_Sub2,
    M_Scale2: M_Scale2,
};

declare function __import__M_Vec2 (): __Mod__M_Vec2;

// -----------------------------------------------------------------------------
// engine/m_vec3.ts
// -----------------------------------------------------------------------------
type vec3_t = Float32Array;
type vec4_t = Float32Array;
type M_Vec3 = (x: number, y: number, z: number) => vec3_t;
type M_Vec3FromVec4 = (u: vec4_t) => vec3_t;
type M_Dot3 = (u: vec3_t, v: vec3_t) => number;
type M_Cross3 = (u: vec3_t, v: vec3_t) => vec3_t;
type M_Add3 = (u: vec3_t, v: vec3_t) => vec3_t;
type M_Sub3 = (u: vec3_t, v: vec3_t) => vec3_t;
type M_Scale3 = (u: vec3_t, s: number) => vec3_t;
type M_Mag3 = (u: vec3_t) => number;
type M_Norm3 = (u: vec3_t) => vec3_t;
type M_Perp3 = (vec: vec3_t, base: vec3_t) => vec3_t;

type M_RotateAroundAxis3 = (
    point: vec3_t,
    axis: vec3_t,
    angle: number
) => vec3_t;

type M_DistToPlane3 = (
    vec: vec3_t,
    ref: vec3_t,
    normal: vec3_t,
    isAbs?: 1
) => number;

type M_IsInFrontOfPlane3 = (
    vec: vec3_t,
    ref: vec3_t,
    normal: vec3_t
) => boolean;

type __Mod__M_Vec3 = {
    M_Vec3: M_Vec3,
    M_Vec3FromVec4: M_Vec3FromVec4,
    M_Dot3: M_Dot3,
    M_Cross3: M_Cross3,
    M_Add3: M_Add3,
    M_Sub3: M_Sub3,
    M_Scale3: M_Scale3,
    M_Mag3: M_Mag3,
    M_Norm3: M_Norm3,
    M_Perp3: M_Perp3,
    M_RotateAroundAxis3: M_RotateAroundAxis3,
    M_DistToPlane3: M_DistToPlane3,
    M_IsInFrontOfPlane3: M_IsInFrontOfPlane3,
};

declare function __import__M_Vec3 (): __Mod__M_Vec3;

// -----------------------------------------------------------------------------
// engine/m_mat4.ts
// -----------------------------------------------------------------------------
type mat4_t = Float32Array;
type M_Vec4FromVec3 = (u: pvec3_t | vec3_t, w: number) => vec4_t;
type M_Mat4 = (x: vec4_t, y: vec4_t, z: vec4_t, w: vec4_t) => mat4_t;
type M_QuickInv4 = (mat: mat4_t) => mat4_t;
type M_Transform4 = (mat: mat4_t, vec: vec4_t) => vec4_t;

type __Mod__M_Mat4 = {
    M_Vec4FromVec3: M_Vec4FromVec3,
    M_Mat4: M_Mat4,
    M_QuickInv4: M_QuickInv4,
    M_Transform4: M_Transform4,
};

declare function __import__M_Mat4 (): __Mod__M_Mat4;

// -----------------------------------------------------------------------------
// engine/m_math.ts
// -----------------------------------------------------------------------------
type M_RadToDeg = (radian: number) => number;
type M_Clamp = (number: number, lower: number, upper: number) => number;
type M_ToFixedDigits = (number: number, nDigits: number) => number;
type M_FastSign = (number: number) => number;

type __Mod__M_Math = {
    PI_2: number,
    M_RadToDeg: M_RadToDeg,
    M_Clamp: M_Clamp,
    M_ToFixedDigits: M_ToFixedDigits,
    M_FastSign: M_FastSign,
};

declare function __import__M_Math (): __Mod__M_Math;

// -----------------------------------------------------------------------------
// engine/m_tri3.ts
// -----------------------------------------------------------------------------
type tri3_t = [vec3_t, vec3_t, vec3_t];
type M_Tri3 = (a3: vec3_t, b3: vec3_t, c3: vec3_t) => tri3_t;
type M_TriNormal3 = (tri3: tri3_t) => vec3_t;
type M_TransformTri3 = (transform4: mat4_t, tri3: tri3_t) => tri3_t;
type M_AABB3FromTri3 = (tri3: tri3_t) => aabb3_t;

type M_RotateTriAroundAxis3 = (
    tri3: tri3_t,
    axis3: vec3_t,
    angle: number
) => tri3_t;

type __Mod__M_Tri3 = {
    M_Tri3: M_Tri3,
    M_TriNormal3: M_TriNormal3,
    M_TransformTri3: M_TransformTri3,
    M_AABB3FromTri3: M_AABB3FromTri3,
    M_RotateTriAroundAxis3: M_RotateTriAroundAxis3,
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

type R_InitCamera = (
    fovy: number,
    aspect: number,
    zNear: number,
    zFar: number,
    eye: pvec3_t,
    velocity: number
) => void;

type R_UpdateCamera = (mult: number) => void;
type R_GetCameraState = () => cam3_t;
type R_GetProjectionOrigin = () => vec3_t;
type R_ToViewSpace = (triangle: tri3_t) => tri3_t;
type R_ToClipSpace = (triangle: tri3_t) => tri3_t;

type R_DebugStats = (
    deltaT: number,
    nTrisOnScreen: Uint32Array
) => void;

type R_DebugAxes = () => void;

type __Mod__R_Camera = {
    R_Origin: vec3_t,
    R_Bwd: vec3_t,
    R_InitCamera: R_InitCamera,
    R_UpdateCamera: R_UpdateCamera,
    R_GetCameraState: R_GetCameraState,
    R_GetProjectionOrigin: R_GetProjectionOrigin,
    R_ToViewSpace: R_ToViewSpace,
    R_ToClipSpace: R_ToClipSpace,
    R_DebugStats: R_DebugStats,
    R_DebugAxes: R_DebugAxes,
};

declare function __import__R_Camera (): __Mod__R_Camera;

// -----------------------------------------------------------------------------
// engine/r_draw.ts
// -----------------------------------------------------------------------------
type R_InitFrameBuffer = () => void;
type R_ResetFrameBuffer = () => void;
type R_FlushFrame = () => void;
type R_InitZBuffer = () => void;
type R_ResetZBuffer = () => void;

type R_FillRect = (
    x: number, y: number,
    w: number, h: number,
    r: number, g: number, b: number, a: number
) => void;

type R_DrawLine = (
    sx: number, sy: number,
    dx: number, dy: number,
    r: number, g: number, b: number, a: number,
    stroke: number
) => void;

type R_DrawLine_DDA = (
    sx: number, sy: number,
    dx: number, dy: number,
    r: number, g: number, b: number, a: number,
    stroke: number
) => void;

type R_DrawLine_RayCast = (
    sx: number, sy: number,
    dx: number, dy: number,
    r: number, g: number, b: number, a: number,
    stroke: number
) => void;

type R_DrawTriangle_Wireframe = (
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
    r: number, g: number, b: number, a: number,
    stroke: number
) => void;

type R_FillTriangle_Flat = (
    ax: number, ay: number, aw: number,
    bx: number, by: number, bw: number,
    cx: number, cy: number, cw: number,
    r: number, g: number, b: number, a: number,
    lightLevel: number
) => void;

type R_FillTriangle_Flat_Bresenham = (
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
    r: number, g: number, b: number, a: number
) => void;

type R_DrawTriangle_Textured_Affine = (
    tex: texture_t,
    ax: number, ay: number,
    bx: number, by: number,
    cx: number, cy: number,
    au: number, av: number,
    bu: number, bv: number,
    cu: number, cv: number,
    alpha: number,
    lightLevel: number
) => void;

type R_DrawTriangle_Textured_Perspective = (
    tex: texture_t,
    ax: number, ay: number, aw: number,
    bx: number, by: number, bw: number,
    cx: number, cy: number, cw: number,
    au: number, av: number, ac: number,
    bu: number, bv: number, bc: number,
    cu: number, cv: number, cc: number,
    nax: number, nay: number, naz: number,
    nbx: number, nby: number, nbz: number,
    ncx: number, ncy: number, ncz: number,
    alpha: number,
    lightX?: number, lightY?: number, lightZ?: number
) => void;

type R_DrawImage = (
    img: texture_t,
    sx: number, sy: number,
    sw: number, sh: number,
    dx: number, dy: number,
    dw: number, dh: number,
    alpha?: number,
    lightLevel?: number
) => void;

type R_Print = (
    chars: string,
    x: number, y: number,
    color?: string,
    size?: number,
    fontFamily?: string,
    style?: string
) => void;

type __Mod__R_Draw = {
    R_InitFrameBuffer: R_InitFrameBuffer,
    R_ResetFrameBuffer: R_ResetFrameBuffer,
    R_FlushFrame: R_FlushFrame,
    R_InitZBuffer: R_InitZBuffer,
    R_ResetZBuffer: R_ResetZBuffer,
    R_FillRect: R_FillRect,
    R_DrawLine: R_DrawLine,
    R_DrawLine_DDA: R_DrawLine_DDA,
    R_DrawLine_RayCast: R_DrawLine_RayCast,
    R_DrawTriangle_Wireframe: R_DrawTriangle_Wireframe,
    R_FillTriangle_Flat: R_FillTriangle_Flat,
    /* TODO: uncomment these once they are implemented */
    // R_FillTriangle_Flat_Bresenham: R_FillTriangle_Flat_Bresenham,
    // R_DrawTriangle_Textured_Affine: R_DrawTriangle_Textured_Affine,
    R_DrawTriangle_Textured_Perspective: R_DrawTriangle_Textured_Perspective,
    R_DrawImage: R_DrawImage,
    R_Print: R_Print,
};

declare function __import__R_Draw (): __Mod__R_Draw;

// -----------------------------------------------------------------------------
// engine/r_drawers.ts
// -----------------------------------------------------------------------------
type R_LoadingDrawer = (onEnd?: () => void) => string;
type R_TitleDrawer = (decor: texture_t, onEnd?: () => void) => string;
type R_ErrorDrawer = (reason: string) => void;

type __Mod__R_Drawers = {
    R_LoadingDrawer: R_LoadingDrawer,
    R_TitleDrawer: R_TitleDrawer,
    R_ErrorDrawer: R_ErrorDrawer,
};

declare function __import__R_Drawers (): __Mod__R_Drawers;

// -----------------------------------------------------------------------------
// engine/r_geometry.ts
// -----------------------------------------------------------------------------
type uvface_t = [number, number, number, string];
type R_ToggleGlobalRotation = () => void;
type R_ChangeRenderMode = () => void;

type R_LoadGeometry = (
    vertices: pvec3_t[], nVertices: number,
    triangles: pvec3_t[], nTriangles: number
) => void;

type R_InitUVTable = (
    vertices: pvec2_t[],
    triangles: uvface_t[],
    nTriangles: number
) => void;

type R_UpdateGeometry = () => void;
type R_RenderGeometries = (nTrisOnScreen: Uint32Array) => void;
type R_Tris = () => tri3_t[];

type __Mod__R_Geometry = {
    R_ToggleGlobalRotation: R_ToggleGlobalRotation,
    R_ChangeRenderMode: R_ChangeRenderMode,
    R_LoadGeometry: R_LoadGeometry,
    R_InitUVTable: R_InitUVTable,
    R_UpdateGeometry: R_UpdateGeometry,
    R_RenderGeometries: R_RenderGeometries,
    R_Tris: R_Tris,
};

declare function __import__R_Geometry (): __Mod__R_Geometry;

// -----------------------------------------------------------------------------
// engine/r_screen.ts
// -----------------------------------------------------------------------------
type R_FlushBuffer = (buffer: ImageData) => void;
type R_InitBuffer = (w: number, h: number) => ImageData;

type __Mod__R_Screen = {
    R_ScreenElement: HTMLCanvasElement,
    R_Ctx: CanvasRenderingContext2D,
    R_FlushBuffer: R_FlushBuffer,
    R_InitBuffer: R_InitBuffer,
};

declare function __import__R_Screen (): __Mod__R_Screen;

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
type G_Run = (setupResolution?: setup_resolution_t) => void;
type __Mod__G_Run = { G_Run: G_Run };
declare function __import__G_Run (): __Mod__G_Run;

// -----------------------------------------------------------------------------
// game/g_setup.ts
// -----------------------------------------------------------------------------
type setup_resolution_t = { loadingId: string };
type G_Setup = () => Promise<setup_resolution_t | undefined>;
type __Mod__G_Setup = { G_Setup: G_Setup };
declare function __import__G_Setup (): __Mod__G_Setup;
