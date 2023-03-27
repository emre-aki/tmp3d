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

    /* FIXME: make into a bitmask!
     *
     * 0|1 - wireframe
     * 0|1 - smooth
     * 0|1 - textured
     *
     * 001 - wireframe
     * 010 - smooth
     * 011 - smooth + wireframe
     * 100 - textured + flat
     * 101 - textured + flat + wireframe
     * 110 - textured + smooth
     * 111 - textured + smooth + wireframe
     */
    const SHADER_MODE = {
        FLAT: "FLAT",
        TEXTURED: "TEXTURED",
        TEXTURED_SHADED: "TEXTURED_SHADED",
        WIREFRAME: "WIREFRAME",
    } as const;

    const SHADER_MODES = [
        SHADER_MODE.WIREFRAME,
        SHADER_MODE.FLAT,
        SHADER_MODE.TEXTURED,
        SHADER_MODE.TEXTURED_SHADED,
    ] as const;

    const nShaders = SHADER_MODES.length;

    const shaderChangeDebounce = 250;
    let mode = 3;
    let lastShaderChange = Date.now();

    /* the vertex shader object */
    const vso = {
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
    const pso = {
        // shader mode
        mode: SHADER_MODES[mode],
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
        normalX: 0, normalY: 0, normalZ: 0,
        // the position of the point light in world space, or the direction of
        // the directional light, both of which affect the entire scene
        lightX: undefined, lightY: undefined, lightZ: undefined,
        // alpha compositing
        alpha: 1,
    };

    function R_ChangeShader (): void
    {
        const now = Date.now();
        if (I_GetKeyState(I_Keys.R) &&
            now - lastShaderChange > shaderChangeDebounce)
        {
            if (++mode === nShaders) mode = 0;
            pso.mode = SHADER_MODES[mode];
            lastShaderChange = now;
        }
    }

    window.__import__R_Shader = function ()
    {
        return {
            R_VertexShaderObj: vso,
            R_PixelShaderObj: pso,
            R_ShaderMode: SHADER_MODE,
            R_ChangeShader,
        };
    };
})();
