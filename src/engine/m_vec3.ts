/*
 *  m_vec3.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The module for carrying out 3-D vector math.
 */

(function (): void
{
    function M_Vec3 (x: number, y: number, z: number): vec3_t
    {
        return Float32Array.from([x, y, z]);
    }

    function M_Vec3FromVec4 (u: vec4_t): vec3_t
    {
        const w_ = 1 / u[3];

        return M_Vec3(u[0] * w_, u[1] * w_, u[2] * w_);
    }

    function M_Dot3 (u: vec3_t, v: vec3_t): number
    {
        return u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    }

    function M_Cross3 (u: vec3_t, v: vec3_t): vec3_t
    {
        return M_Vec3(u[1] * v[2] - u[2] * v[1],
                      u[2] * v[0] - u[0] * v[2],
                      u[0] * v[1] - u[1] * v[0]);
    }

    function M_Add3 (u: vec3_t, v: vec3_t): vec3_t
    {
        return M_Vec3(u[0] + v[0], u[1] + v[1], u[2] + v[2]);
    }

    function M_Sub3 (u: vec3_t, v: vec3_t): vec3_t
    {
        return M_Vec3(u[0] - v[0], u[1] - v[1], u[2] - v[2]);
    }

    function M_Scale3 (u: vec3_t, s: number): vec3_t
    {
        return M_Vec3(s * u[0], s * u[1], s * u[2]);
    }

    function M_Mag3 (u: vec3_t): number
    {
        return Math.sqrt(u[0] * u[0] + u[1] * u[1] + u[2] * u[2]);
    }

    function M_Norm3 (u: vec3_t): vec3_t
    {
        const mag_ = 1 / M_Mag3(u);

        return M_Vec3(u[0] * mag_, u[1] * mag_, u[2] * mag_);
    }

    function M_Base3 (vec: vec3_t, base: vec3_t): vec3_t
    {
        return M_Sub3(vec, M_Scale3(base, M_Dot3(base, vec)));
    }

    /* NOTE: Rodrigues' axis-angle rotations */
    function
    M_RotateAroundAxis3
    ( point: vec3_t,
      axis: vec3_t,
      angle: number ): vec3_t
    {
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const a = M_Scale3(axis, M_Dot3(axis, point) * (1 - cos));
        const b = M_Scale3(point, cos);
        const c = M_Scale3(M_Cross3(axis, point), sin);

        return M_Add3(M_Add3(a, b), c);
    }

    function
    M_DistToPlane3
    ( vec: vec3_t,
      ref: vec3_t,
      normal: vec3_t,
      isAbs?: 1 ): number
    {
        const distance = M_Dot3(vec, normal) - M_Dot3(ref, normal);

        return isAbs ? Math.abs(distance) : distance;
    }

    function
    M_IsInFrontOfPlane3
    ( vec: vec3_t,
      ref: vec3_t,
      normal: vec3_t ): boolean
    {
        return M_DistToPlane3(vec, ref, normal) > 0;
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
        };
    };
})();
