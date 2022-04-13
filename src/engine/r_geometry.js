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
    const M_Tri3 = __import__M_Tri3();
    const Tri3 = M_Tri3.M_Tri3;

    const M_Vec3 = __import__M_Vec3();
    const Vec3 = M_Vec3.M_Vec3;

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

    function R_TriPool ()
    {
        return triPool3;
    }

    window.__import__R_Geometry = function ()
    {
        return {
            R_LoadGeometry: R_LoadGeometry,
            R_UpdateGeometry: R_UpdateGeometry,
            R_TriPool: R_TriPool,
        };
    };
})();
