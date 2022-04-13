/*
 *  m_tri3.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-20.
 *
 *  SYNOPSIS:
 *      The module that houses some utilities to operate on triangles in 3-D.
 */

(function ()
{
    /* NOTE: Triangles employ counter-clockwise order */
    // TODO: maybe, no need for a Tri3 object at all??

    const M_Vec3 = __import__M_Vec3();
    const M_Sub3 = M_Vec3.M_Sub3;
    const M_Cross3 = M_Vec3.M_Cross3;
    const M_Norm3 = M_Vec3.M_Norm3;
    const M_Vec3FromVec4 = M_Vec3.M_Vec3FromVec4;

    const M_Mat4 = __import__M_Mat4();
    const M_Transform4 = M_Mat4.M_Transform4;
    const M_Vec4FromVec3 = M_Mat4.M_Vec4FromVec3;

    function M_Tri3 (a3, b3, c3)
    {
        return [a3, b3, c3];
    }

    function M_TriNormal3 (tri3)
    {
        const ab = M_Sub3(tri3[1], tri3[0]), ac = M_Sub3(tri3[2], tri3[0]);
        return M_Norm3(M_Cross3(ab, ac));
    }

    function M_TransformTri3 (transform4, tri3)
    {
        const triA3 = tri3[0], triB3 = tri3[1], triC3 = tri3[2];
        const triA4 = M_Vec4FromVec3(triA3, 1);
        const triB4 = M_Vec4FromVec3(triB3, 1);
        const triC4 = M_Vec4FromVec3(triC3, 1);
        const triATransformed4 = M_Transform4(transform4, triA4);
        const triBTransformed4 = M_Transform4(transform4, triB4);
        const triCTransformed4 = M_Transform4(transform4, triC4);
        return M_Tri3(M_Vec3FromVec4(triATransformed4),
                      M_Vec3FromVec4(triBTransformed4),
                      M_Vec3FromVec4(triCTransformed4));
    }

    window.__import__M_Tri3 = function ()
    {
        return {
            M_Tri3: M_Tri3,
            M_TriNormal3: M_TriNormal3,
            M_TransformTri3: M_TransformTri3,
        };
    };
})();
