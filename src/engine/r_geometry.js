/*
 *  r_geometry.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-20.
 *
 *  SYNOPSIS:
 *      The module that helps load, update and read 3-D geometry data in memory.
 */

(function ()
{
    const DEBUG_MODE = window.__DEBUG_MODE__;

    const G_Const = __import__G_Const();
    const SCREEN_W = G_Const.SCREEN_W, SCREEN_H = G_Const.SCREEN_H;
    const SCREEN_W_2 = SCREEN_W * 0.5, SCREEN_H_2 = SCREEN_H * 0.5;

    const I_Input = __import__I_Input();
    const I_GetKeyState = I_Input.I_GetKeyState;
    const I_Keys = I_Input.I_Keys;

    const M_Tri3 = __import__M_Tri3();
    const M_TriNormal3 = M_Tri3.M_TriNormal3;
    const Tri3 = M_Tri3.M_Tri3;

    const M_Vec3 = __import__M_Vec3();
    const M_IsInFrontOfPlane3 = M_Vec3.M_IsInFrontOfPlane3;
    const M_Dot3 = M_Vec3.M_Dot3;
    const Vec3 = M_Vec3.M_Vec3;

    const R_Camera = __import__R_Camera();
    const R_DebugAxes = R_Camera.R_DebugAxes;
    const R_ToViewSpace = R_Camera.R_ToViewSpace;
    const R_ToClipSpace = R_Camera.R_ToClipSpace;

    const R_Draw = __import__R_Draw();
    const R_DrawTriangleWireframe = R_Draw.R_DrawTriangleWireframe;
    const R_FillTriangle_Flat = R_Draw.R_FillTriangle_Flat;

    const ORIGIN = R_Camera.R_ORIGIN, BWD = R_Camera.R_BWD;

    // TODO: make a separate lighting controller module, maybe??
    const DIRECTIONAL_LIGHT = BWD;

    let triPool3; // a pool of raw triangle data
    let uvTable3; // respective uv-coordinates of each triangle in the pool
    let cullBuffer, nCullBuffer;


    const RENDER_MODE = { FLAT: "FLAT", WIREFRAME: "WIREFRAME" };

    const RENDER_MODES = [RENDER_MODE.WIREFRAME, RENDER_MODE.FLAT];

    let renderMode = 1;
    let lastRenderModeChange = new Date().getTime();
    let renderModeChangeDebounce = 250;

    function R_ChangeRenderMode ()
    {
        const now = new Date().getTime();
        if (I_GetKeyState(I_Keys.R) &&
            now - lastRenderModeChange > renderModeChangeDebounce)
        {
            ++renderMode;
            if (renderMode === RENDER_MODES.length) renderMode = 0;
            lastRenderModeChange = new Date().getTime();
        }
    }

    function R_LoadGeometry (vertices, triangles, nTriangles)
    {
        triPool3 = Array(nTriangles);
        cullBuffer = new Uint32Array(nTriangles); // TODO: maybe 16??
        for (let i = 0; i < nTriangles; ++i)
        {
            const tri3Data = triangles[i];
            const triA3 = vertices[tri3Data[0]];
            const triB3 = vertices[tri3Data[1]];
            const triC3 = vertices[tri3Data[2]];
            triPool3[i] = Tri3(Vec3(triA3[0], triA3[1], triA3[2]),
                               Vec3(triB3[0], triB3[1], triB3[2]),
                               Vec3(triC3[0], triC3[1], triC3[2]));
        }
    }

    function R_InitUVTable (vertices, triangles, nTriangles)
    {
        uvTable3 = Array(nTriangles);
        for (let i = 0; i < nTriangles; ++i)
        {
            const tri3Data = triangles[i];
            const texUVA2 = vertices[tri3Data[0]];
            const texUVB2 = vertices[tri3Data[1]];
            const texUVC2 = vertices[tri3Data[2]];
            uvTable3[i] = Tri3(Vec3(texUVA2[0], texUVA2[1], 1),
                               Vec3(texUVB2[0], texUVB2[1], 1),
                               Vec3(texUVC2[0], texUVC2[1], 1));
        }
    }

    function R_UpdateGeometry ()
    {
        // TODO: implement
    }

    function R_CullGeometry (triangles, nTriangles)
    {
        let nTrianglesAfterCulling = 0;
        for (let i = 0; i < nTriangles; ++i)
        {
            const triView = R_ToViewSpace(triangles[i]);
            const aView = triView[0];
            if (
                // TODO: remove this once you implement triangle clipping
                // if the triangle is at least partially in front of the camera
                (aView[2] > 0 || triView[1][2] > 0 || triView[2][2] > 0) &&
                // backface-culling: if the triangle is facing the camera
                M_IsInFrontOfPlane3(ORIGIN, aView, M_TriNormal3(triView))
                // TODO: implement occlusion-culling
            )
            {
                cullBuffer[nTrianglesAfterCulling] = i;
                ++nTrianglesAfterCulling;
            }
        }
        nCullBuffer = nTrianglesAfterCulling;
    }

    function R_RenderGeometry (nTrisOnScreen)
    {
        const nTriangles = triPool3.length; // FIXME: make into a global const.
        R_CullGeometry(triPool3, nTriangles);
        for (let i = 0; i < nCullBuffer; ++i)
        {
            const triWorld = triPool3[cullBuffer[i]];
            const triView = R_ToViewSpace(triWorld);
            /* TODO: implement triangle clipping in world (or clip) space */
            const triClip = R_ToClipSpace(triView);
            const aClip3 = triClip[0], bClip3 = triClip[1], cClip3 = triClip[2];
            const ax = aClip3[0] * SCREEN_W_2 + SCREEN_W_2;
            const ay = aClip3[1] * SCREEN_H_2 + SCREEN_H_2;
            const bx = bClip3[0] * SCREEN_W_2 + SCREEN_W_2;
            const by = bClip3[1] * SCREEN_H_2 + SCREEN_H_2;
            const cx = cClip3[0] * SCREEN_W_2 + SCREEN_W_2;
            const cy = cClip3[1] * SCREEN_H_2 + SCREEN_H_2;
            switch (RENDER_MODES[renderMode])
            {
                case RENDER_MODE.WIREFRAME:
                    R_DrawTriangleWireframe(ax, ay, bx, by, cx, cy,
                                            255, 255, 255, 255, 2);
                    break;
                case RENDER_MODE.FLAT:
                {
                    const triNormal = M_TriNormal3(triWorld);
                    // calculate the dot product of the directional light
                    // and the unit normal of the triangle in world space
                    // to determine the level of illumination on the surface
                    const faceLuminance =
                        (M_Dot3(DIRECTIONAL_LIGHT, triNormal) + 1) * 0.5;
                    R_FillTriangle_Flat(ax, ay, bx, by, cx, cy,
                                        255, 255, 255, 255 * faceLuminance);
                    if (DEBUG_MODE)
                        R_DrawTriangleWireframe(ax, ay, bx, by, cx, cy,
                                                0, 0, 0, 255, 2);
                    break;
                }
                default:
                    break;
            }
        }
        if (DEBUG_MODE) R_DebugAxes();
        // TODO: re-calculate after implementing triangle clipping
        nTrisOnScreen[0] = nCullBuffer;
    }

    function R_TriPool ()
    {
        return triPool3;
    }

    window.__import__R_Geometry = function ()
    {
        return {
            R_ChangeRenderMode: R_ChangeRenderMode,
            R_LoadGeometry: R_LoadGeometry,
            R_InitUVTable: R_InitUVTable,
            R_UpdateGeometry: R_UpdateGeometry,
            R_RenderGeometry: R_RenderGeometry,
            R_TriPool: R_TriPool,
        };
    };
})();
