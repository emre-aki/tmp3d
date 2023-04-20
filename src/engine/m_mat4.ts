/*
 *  m_mat4.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The module that houses some 4x4 matrix utilities that help transform 3-D
 *      vectors.
 */

(function (): void
{
    const N_COLS = 4;
    const SIZE = N_COLS * N_COLS;

    function M_Vec4 (x: number, y: number, z: number, w: number): vec4_t
    {
        return Float32Array.from([x, y, z, w]);
    }

    function M_Vec4FromVec3 (u: pvec3_t | vec3_t, w: number): vec4_t
    {
        return M_Vec4(u[0], u[1], u[2], w);
    }

    function M_Dot4 (u: vec4_t, v: vec4_t): number
    {
        return u[0] * v[0] + u[1] * v[1] + u[2] * v[2] + u[3] * v[3];
    }

    function M_Mat4 (x: vec4_t, y: vec4_t, z: vec4_t, w: vec4_t): mat4_t
    {
        const mat = new Float32Array(SIZE);
        mat[0] = x[0]; mat[4] = x[1]; mat[8] = x[2]; mat[12] = x[3];
        mat[1] = y[0]; mat[5] = y[1]; mat[9] = y[2]; mat[13] = y[3];
        mat[2] = z[0]; mat[6] = z[1]; mat[10] = z[2]; mat[14] = z[3];
        mat[3] = w[0]; mat[7] = w[1]; mat[11] = w[2]; mat[15] = w[3];

        return mat;
    }

    function M_QuickInv4 (mat: mat4_t): mat4_t
    {
        /* we can hack our way here and decompose the original transform matrix
         * `m` as such:
         *
         *   m = T * R
         *
         *       ┌          ┐   ┌               ┐
         *       | 1 0 0 tx |   | x.x y.x z.x 0 |
         *     = | 0 1 0 ty | * | x.y y.y z.y 0 |
         *       | 0 0 1 tz |   | x.z y.z z.z 0 |
         *       | 0 0 0 1  |   | 0   0   0   1 |
         *       └          ┘   └               ┘
         *
         * decomposing this way, we can invert `T` and `R` separately:
         *
         *   m^(-1) = R^(-1) * T^(-1)
         *
         *            ┌               ┐   ┌            ┐
         *            | x.x x.y x.z 0 |   | 1 0 0 -t.x |
         *          = | y.x y.y y.z 0 | * | 0 1 0 -t.y |
         *            | z.x z.y z.z 0 |   | 0 0 1 -t.z |
         *            | 0   0   0   1 |   | 0 0 0  1   |
         *            └               ┘   └            ┘
         *
         * because the basis vectors `x`, `y`, and `z` (the first 3 columns in
         * `R`) are guaranteed to be orthonormal, we were able to take a
         * shortcut in calculating the inverse by simply transposing `R`.
         * likewise, to invert the translation matrix `T`, all we need to do is
         * scale the translation vector `t` (the final column in `T`) by `-1`.
         *
         * this gives us the inverted transform:
         *
         *            ┌                     ┐
         *            | x.x x.y x.z -<t, x> |
         *   m^(-1) = | y.x y.y y.z -<t, y> |
         *            | z.x z.y z.z -<t, z> |
         *            | 0   0   0    1      |
         *            └                     ┘
         */
        /* invert `R` */
        const inv = new Float32Array(SIZE);
        inv[0] = mat[0]; inv[4] = mat[1]; inv[8] = mat[2];
        inv[1] = mat[4]; inv[5] = mat[5]; inv[9] = mat[6];
        inv[2] = mat[8]; inv[6] = mat[9]; inv[10] = mat[10];
        /* invert `T` */
        const T = M_Vec4(mat[3], mat[7], mat[11], mat[15]);
        inv[3] = -M_Dot4(M_Vec4(inv[0], inv[1], inv[2], mat[12]), T);
        inv[7] = -M_Dot4(M_Vec4(inv[4], inv[5], inv[6], mat[13]), T);
        inv[11] = -M_Dot4(M_Vec4(inv[8], inv[9], inv[10], mat[14]), T);
        inv[15] = 1;

        return inv;
    }

    /*
    function M_Inv4 (mat: mat4_t): mat4_t
    {
        // TODO: implement
    }
    */

    function M_Transform4 (mat: mat4_t, vec: vec4_t): vec4_t
    {
        const matRow0 = M_Vec4(mat[0], mat[1], mat[2], mat[3]);
        const matRow1 = M_Vec4(mat[4], mat[5], mat[6], mat[7]);
        const matRow2 = M_Vec4(mat[8], mat[9], mat[10], mat[11]);
        const matRow3 = M_Vec4(mat[12], mat[13], mat[14], mat[15]);

        return M_Vec4(M_Dot4(matRow0, vec), M_Dot4(matRow1, vec),
                      M_Dot4(matRow2, vec), M_Dot4(matRow3, vec));
    }

    window.__import__M_Mat4 = function ()
    {
        return {
            M_Vec4FromVec3: M_Vec4FromVec3,
            M_Mat4: M_Mat4,
            M_QuickInv4: M_QuickInv4,
            M_Transform4: M_Transform4,
        };
    };
})();
