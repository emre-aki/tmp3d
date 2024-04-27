/*
 *  r_shader.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2023-02-05.
 *
 *  SYNOPSIS:
 *      A module that exposes "static" references to "vertex" and "pixel" shader
 *      objects to be consumed by the rendering backend.
 *
 *      Also manages the changes in the current shader mode as well.
 */

(function (): void
{
    const I_Input = __import__I_Input();
    const I_GetKeyState = I_Input.I_GetKeyState;
    const I_Keys = I_Input.I_Keys;

    const R_Drawers = __import__R_Drawers();
    const R_SetOnScreenMessage = R_Drawers.R_SetOnScreenMessage;

    // bit flag to set wireframe mode on/off
    const SHADER_MODE_MASK_WIREFRAME = 0x1;
    // bit flag to set fill mode on/off — off means no fills, in which case
    // overrides whatever is set to `SHADER_MODE_MASK_TEXTURED_FILL`
    const SHADER_MODE_MASK_FILL = 0x2;
    // bit flag to set texture mapping on/off
    const SHADER_MODE_MASK_TEXTURE_FILL = 0x4;
    // bit flag to set light calculations on/off — off means ambient (base)
    // light only, in which case overrides whatever is set to
    // `SHADER_MODE_MASK_SMOOTH` or `SHADER_MODE_MASK_POINT_LIGHT`
    const SHADER_MODE_MASK_LIGHTS = 0x8;
    // bit flag to set per-pixel smooth shading calculations on/off — off means
    // flat shading, a constant light intensity over the entire triangle
    const SHADER_MODE_MASK_SMOOTH = 0x10;
    // bit flag to be used to switch between directional and point lights —
    // requires `SHADER_MODE_MASK_LIGHTS` to be set
    const SHADER_MODE_MASK_POINT_LIGHT = 0x20;

    let mode = SHADER_MODE_MASK_FILL |
               SHADER_MODE_MASK_TEXTURE_FILL |
               SHADER_MODE_MASK_LIGHTS |
               SHADER_MODE_MASK_SMOOTH |
               SHADER_MODE_MASK_POINT_LIGHT;

    const shaderChangeDebounce = 250;
    let lastShaderChange = Date.now();

    /* the vertex shader object */
    const vso: vso_t = {
        /* screen space coordinates of the triangle, along with the extra
         * dimension `w` that is the z-coordinate in the perspective-correct
         * space
         */
        ax: 0, ay: 0, aw: 0,
        bx: 0, by: 0, bw: 0,
        cx: 0, cy: 0, cw: 0,
        /* color coordinates at each vertex in the RGB space to be interpolated
         * across the entire triangle
         */
        ar: 0, ag: 0, ab: 0,
        br: 0, bg: 0, bb: 0,
        cr: 0, cg: 0, cb: 0,
        /* UV coordinates to map onto the triangle */
        au: 0, av: 0,
        bu: 0, bv: 0,
        cu: 0, cv: 0,
        /* vertex normals */
        nax: 0, nay: 0, naz: 0,
        nbx: 0, nby: 0, nbz: 0,
        ncx: 0, ncy: 0, ncz: 0,
        /* world space coordinates of the triangle */
        wax: 0, way: 0, waz: 0,
        wbx: 0, wby: 0, wbz: 0,
        wcx: 0, wcy: 0, wcz: 0,
    };

    /* the pixel (fragment) shader object */
    const pso: pso_t = {
        // shader mode
        mode,
        // the bitmap texture to map onto the triangle — color fill mode is
        // inferred if set to `undefined`
        tex: undefined,
        // y-coordinate of the current scanline in screen space
        dy: 0,
        // the endpoints of the current scanline in screen space
        dx0: 0, dx1: 0,
        // perspective-corrected z-coordinates to lerp across the current
        // scanline
        w0: 0, w1: 0,
        // perspective-corrected UV coordinates to lerp across the current
        // scanline
        u0: 0, v0: 0, u1: 0, v1: 0,
        // perspective-corrected vertex normals to lerp across the current
        // scanline
        nx0: 0, ny0: 0, nz0: 0, nx1: 0, ny1: 0, nz1: 0,
        // perspective-corrected world space coordinates of the triangle to lerp
        // across the current scanline
        wx0: 0, wy0: 0, wz0: 0, wx1: 0, wy1: 0, wz1: 0,
        // perspective-corrected color coordinates to lerp across the current
        // scanline
        r0: 0, g0: 0, b0: 0, r1: 0, g1: 0, b1: 0,
        // FIXME: should lighting-related attributes really be here? maybe they
        // should be in their own separate object instead — how about adding a
        // "light objects buffer" to support multiple point/directional lights
        // in a scene?
        // surface normal of the triangle used in flat-shading
        normalX: undefined, normalY: undefined, normalZ: undefined,
        // the position of the point light in world space, or the direction of
        // the directional light, both of which affect the entire scene
        lightX: undefined, lightY: undefined, lightZ: undefined,
        // whether to interpret the light defined by the vector
        // <`lightX`, `lightY`, `lightZ`> as a directional light or as a point
        // light
        isPointLight: 0,
        // alpha compositing
        alpha: 1,
    };

    //
    // R_ToggleWireframe
    // Toggle wireframe mode on/off
    //
    function R_ToggleWireframe (): void
    {
        const now = Date.now();
        if (I_GetKeyState(I_Keys.F) &&
            now - lastShaderChange > shaderChangeDebounce)
        {
            mode ^= SHADER_MODE_MASK_WIREFRAME;
            pso.mode = mode;
            lastShaderChange = now;
        }
    }

    //
    // R_ChangeFillMode
    // Cycle between flat color, texture and no fill modes
    //
    function R_ChangeFillMode (): void
    {
        const now = Date.now();
        if (I_GetKeyState(I_Keys.R) &&
            now - lastShaderChange > shaderChangeDebounce)
        {
            const fillModeMask = mode & SHADER_MODE_MASK_FILL;
            const textureModeMask = mode & SHADER_MODE_MASK_TEXTURE_FILL;
            // @ts-ignore
            const noFill = !!fillModeMask - 1, fill = !fillModeMask - 1;
            // @ts-ignore
            const isTextureFill = !textureModeMask - 1;
            /* branchless programming 101? 🤦‍♀️🔫 */
            mode ^= ((noFill | isTextureFill) & SHADER_MODE_MASK_FILL) |
                    (fill & SHADER_MODE_MASK_TEXTURE_FILL);
            pso.mode = mode;
            lastShaderChange = now;
            if (mode & SHADER_MODE_MASK_TEXTURE_FILL)
                R_SetOnScreenMessage("Texture fill", 50);
            else if (mode & SHADER_MODE_MASK_FILL)
                R_SetOnScreenMessage("Color fill", 50);
            else
                R_SetOnScreenMessage("No fill", 50);
        }
    }

    //
    // R_ChangeLightingMode
    // Cycle between smooth, flat, and no shading, i.e., ambient (base) light
    // modes
    //
    function R_ChangeLightingMode (): void
    {
        const now = Date.now();
        if (I_GetKeyState(I_Keys.L) &&
            now - lastShaderChange > shaderChangeDebounce)
        {
            const lightsOnMask = mode & SHADER_MODE_MASK_LIGHTS;
            const smoothModeMask = mode & SHADER_MODE_MASK_SMOOTH;
            // @ts-ignore
            const lightsOff = !!lightsOnMask - 1, lightsOn = !lightsOnMask - 1;
            // @ts-ignore
            const isSmooth = !smoothModeMask - 1;
            /* branchless programming 102!? 🤷‍♀️ */
            mode ^= ((lightsOff | isSmooth) & SHADER_MODE_MASK_LIGHTS) |
                    (lightsOn & SHADER_MODE_MASK_SMOOTH);
            pso.mode = mode;
            lastShaderChange = now;
            if (mode & SHADER_MODE_MASK_SMOOTH)
                R_SetOnScreenMessage("Smooth shading", 50);
            else if (mode & SHADER_MODE_MASK_LIGHTS)
                R_SetOnScreenMessage("Flat shading", 50);
            else
                R_SetOnScreenMessage("Ambient light", 50);
        }
    }

    //
    // R_TogglePointLight
    // Switch between directional and point lights
    //
    function R_TogglePointLight (): void
    {
        const now = Date.now();
        if (I_GetKeyState(I_Keys.P) &&
            now - lastShaderChange > shaderChangeDebounce)
        {
            mode ^= SHADER_MODE_MASK_POINT_LIGHT;
            pso.mode = mode;
            lastShaderChange = now;
            if (mode & SHADER_MODE_MASK_POINT_LIGHT)
                R_SetOnScreenMessage("Point light", 50);
            else
                R_SetOnScreenMessage("Directional light", 50);
        }
    }

    window.__import__R_Shader = function ()
    {
        return {
            R_VertexShaderObj: vso,
            R_PixelShaderObj: pso,
            R_ShaderMode_Wireframe: SHADER_MODE_MASK_WIREFRAME,
            R_ShaderMode_Fill: SHADER_MODE_MASK_FILL,
            R_ShaderMode_Texture: SHADER_MODE_MASK_TEXTURE_FILL,
            R_ShaderMode_Lights: SHADER_MODE_MASK_LIGHTS,
            R_ShaderMode_Smooth: SHADER_MODE_MASK_SMOOTH,
            R_ShaderMode_PointLight: SHADER_MODE_MASK_POINT_LIGHT,
            R_ToggleWireframe,
            R_ChangeFillMode,
            R_ChangeLightingMode,
            R_TogglePointLight,
        };
    };
})();
