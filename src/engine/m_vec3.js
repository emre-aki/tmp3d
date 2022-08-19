/*
 *  m_vec3.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The module for carrying out 3-D vector math.
 */

(function ()
{
    function M_Vec3 (x, y, z)
    {
        return Float32Array.from([x, y, z]);
    }

    function M_Vec3FromVec4 (u)
    {
        return M_Vec3(u[0] / u[3], u[1] / u[3], u[2] / u[3]);
    }

    function M_Dot3 (u, v)
    {
        return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    }

    function M_Cross3 (u, v)
    {
        return M_Vec3(u[1] * v[2] - u[2] * v[1],
                      u[2] * v[0] - u[0] * v[2],
                      u[0] * v[1] - u[1] * v[0]);
    }

    function M_Add3 (u, v)
    {
        return M_Vec3(u[0] + v[0], u[1] + v[1], u[2] + v[2]);
    }

    function M_Sub3 (u, v)
    {
        return M_Vec3(u[0] - v[0], u[1] - v[1], u[2] - v[2]);
    }

    function M_Scale3 (u, s)
    {
        return M_Vec3(s * u[0], s * u[1], s * u[2]);
    }

    function M_Mag3 (u)
    {
        return Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
    }

    function M_Norm3 (u)
    {
        const mag = M_Mag3(u);
        return M_Vec3(u[0] / mag, u[1] / mag, u[2] / mag);
    }

    function M_Base3 (vec, base)
    {
        return M_Sub3(vec, M_Scale3(base, M_Dot3(base, vec)));
    }

    /* NOTE: Rodrigues' axis-angle rotations */
    function M_RotateAroundAxis3 (point, axis, angle)
    {
        const vY = M_Scale3(axis, M_Dot3(axis, point));
        const vX = M_Scale3(M_Sub3(point, vY), Math.cos(angle));
        const vZ = M_Scale3(M_Cross3(axis, point), Math.sin(angle));
        const rot = M_Add3(vX, vZ);
        return M_Add3(vY, rot);
    }

    function M_DistToPlane3 (vec, ref, normal, isAbs)
    {
        const distance = M_Dot3(vec, normal) - M_Dot3(ref, normal);
        return isAbs ? Math.abs(distance) : distance;
    }

    function M_IsInFrontOfPlane3 (vec, ref, normal)
    {
        return M_DistToPlane3(vec, ref, normal) > 0;
    }

    function
    M_TimeBeforePlaneCollision3
    ( lineSrc, lineDest,
      planeRef, planeNormal )
    {
        const distToPlaneSrc = M_DistToPlane3(lineSrc, planeRef, planeNormal);
        const distToPlaneDest = M_DistToPlane3(lineDest, planeRef, planeNormal);
        /* if both ends of the line segment are on the same side of the plane,
         * then they do not intersect--return immediately
         */
        if (distToPlaneSrc >= 0 && distToPlaneDest >= 0 ||
            distToPlaneSrc < 0 && distToPlaneDest < 0)
            return;
        const absDistToPlaneSrc = Math.abs(distToPlaneSrc);
        const absDistToPlaneDest = Math.abs(distToPlaneDest);
        // how far we should walk along the line segment, from its start, before
        // we get to the intersection with the plane
        return absDistToPlaneSrc / (absDistToPlaneSrc + absDistToPlaneDest);
    }

    function
    M_LineSegmentVsPlaneCollision3
    ( lineSrc, lineDest,
      planeRef, planeNormal )
    {
        const scale = M_TimeBeforePlaneCollision3(lineSrc, lineDest,
                                                  planeRef, planeNormal);
        if (scale === undefined) return; // early return if there's no collision
        return M_Add3(lineSrc, M_Scale3(M_Sub3(lineDest, lineSrc), scale));
    }

    window.__import__M_Vec3 = function ()
    {
        return {
            M_Vec3: M_Vec3,
            M_Vec3FromVec4: M_Vec3FromVec4,
            M_Dot3: M_Dot3,
            M_Cross3: M_Cross3,
            M_Add3: M_Add3,
            M_Sub3: M_Sub3,
            M_Scale3: M_Scale3,
            M_Mag3: M_Mag3,
            M_Norm3: M_Norm3,
            M_Base3: M_Base3,
            M_RotateAroundAxis3: M_RotateAroundAxis3,
            M_DistToPlane3: M_DistToPlane3,
            M_IsInFrontOfPlane3: M_IsInFrontOfPlane3,
            M_TimeBeforePlaneCollision3: M_TimeBeforePlaneCollision3,
            M_LineSegmentVsPlaneCollision3: M_LineSegmentVsPlaneCollision3,
        };
    };
})();
