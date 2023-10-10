/*
 *  m_vec2.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2023-10-08.
 *
 *  SYNOPSIS:
 *      The module for carrying out 2-D vector math.
 */

(function (): void
{
    function M_Vec2 (x: number, y: number): vec2_t
    {
        return Float32Array.from([x, y]);
    }

    function M_Cross2 (u: vec2_t, v: vec2_t): number
    {
        return u[0] * v[1] - u[1] * v[0];
    }

    function M_Add2 (u: vec2_t, v: vec2_t): vec2_t
    {
        return M_Vec2(u[0] + v[0], u[1] + v[1]);
    }

    function M_Sub2 (u: vec2_t, v: vec2_t): vec2_t
    {
        return M_Vec2(u[0] - v[0], u[1] - v[1]);
    }

    function M_Scale2 (u: vec2_t, s: number): vec2_t
    {
        return M_Vec2(s * u[0], s * u[1]);
    }

    window.__import__M_Vec2 = function ()
    {
        return { M_Vec2, M_Cross2, M_Add2, M_Sub2, M_Scale2 };
    };
})();
