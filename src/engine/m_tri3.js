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
    const M_RotateAroundAxis3 = M_Vec3.M_RotateAroundAxis3;
    const M_Vec3FromVec4 = M_Vec3.M_Vec3FromVec4;
    const Vec3 = M_Vec3.M_Vec3;

    const M_AABB3 = __import__M_AABB3();
    const AABB3 = M_AABB3.M_AABB3;

    const M_Mat4 = __import__M_Mat4();
    const M_Transform4 = M_Mat4.M_Transform4;
    const M_Vec4FromVec3 = M_Mat4.M_Vec4FromVec3;

    function M_Tri3 (a3, b3, c3)
    {
        return [a3, b3, c3];
    }

    function M_TriNormal3 (tri3)
    {
        // (b - a) x (c - a) === (b - a) x (c - b)
        const ab = M_Sub3(tri3[1], tri3[0]), bc = M_Sub3(tri3[2], tri3[1]);
        return M_Norm3(M_Cross3(ab, bc));
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

    function M_AABB3FromTri3 (tri3)
    {
        const triA3 = tri3[0], triB3 = tri3[1], triC3 = tri3[2];
        const origin3 = Vec3(Math.min(triA3[0], triB3[0], triC3[0]),
                             Math.min(triA3[1], triB3[1], triC3[1]),
                             Math.min(triA3[2], triB3[2], triC3[2]));
        const dimensions3 = Vec3(
            Math.max(triA3[0], triB3[0], triC3[0]) - origin3[0],
            Math.max(triA3[1], triB3[1], triC3[1]) - origin3[1],
            Math.max(triA3[2], triB3[2], triC3[2]) - origin3[2]
        );
        return AABB3(origin3, dimensions3);
    }

    function M_RotateTriAroundAxis3 (tri3, axis3, angle)
    {
        const triRotatedA3 = M_RotateAroundAxis3(tri3[0], axis3, angle);
        const triRotatedB3 = M_RotateAroundAxis3(tri3[1], axis3, angle);
        const triRotatedC3 = M_RotateAroundAxis3(tri3[2], axis3, angle);
        return M_Tri3(triRotatedA3, triRotatedB3, triRotatedC3);
    }

    window.__import__M_Tri3 = function ()
    {
        return {
            M_Tri3: M_Tri3,
            M_TriNormal3: M_TriNormal3,
            M_TransformTri3: M_TransformTri3,
            M_AABB3FromTri3: M_AABB3FromTri3,
            M_RotateTriAroundAxis3: M_RotateTriAroundAxis3,
        };
    };
})();
