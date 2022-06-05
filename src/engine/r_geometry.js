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

    let triPool3;

    function R_LoadGeometry (vertices, triangles, nTriangles)
    {
        triPool3 = Array(nTriangles);
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

    function R_UpdateGeometry ()
    {
        // TODO: implement
    }

    function R_RenderGeometry ()
    {
        /* TODO: do frustum culling & occlusion culling */
        const nTris = triPool3.length;
        const trisTransformed = R_ToViewSpace(triPool3, nTris);
        const trisNormalized = R_ToClipSpace(trisTransformed, nTris);
        for (let i = 0; i < nTris; ++i)
        {
            /* TODO: make into a separate function call, maybe?? */
            const triClip = trisNormalized[i];
            const aClip3 = triClip[0], bClip3 = triClip[1], cClip3 = triClip[2];
            const ax = aClip3[0] * SCREEN_W_2 + SCREEN_W_2;
            const ay = aClip3[1] * SCREEN_H_2 + SCREEN_H_2;
            const bx = bClip3[0] * SCREEN_W_2 + SCREEN_W_2;
            const by = bClip3[1] * SCREEN_H_2 + SCREEN_H_2;
            const cx = cClip3[0] * SCREEN_W_2 + SCREEN_W_2;
            const cy = cClip3[1] * SCREEN_H_2 + SCREEN_H_2;
            const triView = trisTransformed[i];
            const aView = triView[0], bView = triView[1], cView = triView[2];
            const aViewZ = aView[2], bViewZ = bView[2], cViewZ = cView[2];
            const triNormal = M_TriNormal3(triView);
            if (
                // if the triangle is not behind the camera
                (aViewZ > 0 || bViewZ > 0 || cViewZ > 0) &&
                // if the triangle is facing the camera
                M_IsInFrontOfPlane3(ORIGIN, aView, triNormal)
            )
            {
                // directional light, emitted from the surface of the triangle:
                // calculate the dot product of the directional light and the
                // unit normal of the triangle to determine the level of
                // illumination on the surface
                const faceLuminance = M_Dot3(BWD, triNormal);
                R_FillTriangle_Flat(ax, ay, bx, by, cx, cy,
                                    255, 255, 255, 255 * faceLuminance);
                if (DEBUG_MODE)
                    R_DrawTriangleWireframe(ax, ay, bx, by, cx, cy,
                                            0, 0, 0, 255, 2);
            }
        }
        if (DEBUG_MODE) R_DebugAxes();
    }

    function R_TriPool ()
    {
        return triPool3;
    }

    window.__import__R_Geometry = function ()
    {
        return {
            R_LoadGeometry: R_LoadGeometry,
            R_UpdateGeometry: R_UpdateGeometry,
            R_RenderGeometry: R_RenderGeometry,
            R_TriPool: R_TriPool,
        };
    };
})();
