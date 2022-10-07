/*
 *  m_collision3.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-10-07.
 *
 *  SYNOPSIS:
 *      Routines for detecting various collisions in 3-D.
 */

(function ()
{
    const M_Vec3 = __import__M_Vec3();
    const M_DistToPlane3 = M_Vec3.M_DistToPlane3;

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

    window.__import__M_Collision3 = function ()
    {
        return {
            M_TimeBeforePlaneCollision3: M_TimeBeforePlaneCollision3,
            M_LineSegmentVsPlaneCollision3: M_LineSegmentVsPlaneCollision3,
        };
    };
})();
