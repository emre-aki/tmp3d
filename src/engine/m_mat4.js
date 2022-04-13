/*
 *  m_mat4.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The module that houses some 4x4 matrix utilities that help transform 3-D
 *      vectors.
 */

(function ()
{
    const N_COLS = 4;
    const SIZE = N_COLS * N_COLS;

    function M_Vec4 (x, y, z, w)
    {
        return Float32Array.from([x, y, z, w]);
    }

    function M_Vec4FromVec3 (u, w)
    {
        return M_Vec4(u[0], u[1], u[2], w);
    }

    function M_Dot4 (u, v)
    {
        return u[0] * v[0] + u[1] * v[1] + u[2] * v[2] + u[3] * v[3];
    }

    function M_Mat4 (x, y, z, w)
    {
        const mat = new Float32Array(SIZE);
        mat[0] = x[0]; mat[1] = x[1]; mat[2] = x[2]; mat[3] = x[3];
        mat[4] = y[0]; mat[5] = y[1]; mat[6] = y[2]; mat[7] = y[3];
        mat[8] = z[0]; mat[9] = z[1]; mat[10] = z[2]; mat[11] = z[3];
        mat[12] = w[0]; mat[13] = w[1]; mat[14] = w[2]; mat[15] = w[3];
        return mat;
    }

    function M_QuickInv4 (mat)
    {
        /* we can hack our way here and decompose the original transform matrix
         * `m` as such:
         *
         *   m = T * R
         *
         *       | 1 0 0 tx |   | x.x y.x z.x 0 |
         *     = | 0 1 0 ty | * | x.y y.y z.y 0 |
         *       | 0 0 1 tz |   | x.z y.z z.z 0 |
         *       | 0 0 0 1  |   | 0   0   0   1 |
         *
         * decomposing this way, we can invert `T` and `R` separately:
         *
         *   m^(-1) = R^(-1) * T^(-1)
         *
         *            | x.x x.y x.z 0 |   | 1 0 0 -t.x |
         *          = | y.x y.y y.z 0 | * | 0 1 0 -t.y |
         *            | z.x z.y z.z 0 |   | 0 0 1 -t.z |
         *            | 0   0   0   1 |   | 0 0 0  1   |
         *
         * because the basis vectors `x`, `y`, and `z` (the first 3 columns in
         * `R`) are guaranteed to be orthonormal, we were able to take a
         * shortcut in calculating the inverse by simply transposing `R`.
         * likewise, to invert the translation matrix `T`, all we need to do is
         * scale the translation vector `t` (the final column in `T`) by `-1`.
         *
         * this gives us the inverted transform:
         *
         *            | x.x x.y x.z -<t, x> |
         *   m^(-1) = | y.x y.y y.z -<t, y> |
         *            | z.x z.y z.z -<t, z> |
         *            | 0   0   0    1      |
         */
        /* invert `R` */
        const inverted = new Float32Array(SIZE);
        inverted[0] = mat[0]; inverted[4] = mat[1]; inverted[8] = mat[2];
        inverted[1] = mat[4]; inverted[5] = mat[5]; inverted[9] = mat[6];
        inverted[2] = mat[8]; inverted[6] = mat[9]; inverted[10] = mat[10];
        /* invert `T` */
        const T = M_Vec4(mat[12], mat[13], mat[14], mat[15]);
        inverted[12] = -M_Dot4(M_Vec4(mat[0], mat[1], mat[2], mat[3]), T);
        inverted[13] = -M_Dot4(M_Vec4(mat[4], mat[5], mat[6], mat[7]), T);
        inverted[14] = -M_Dot4(M_Vec4(mat[8], mat[9], mat[10], mat[11]), T);
        inverted[15] = 1;
        return inverted;
    }

    function M_Inv4 (mat)
    {
        // TODO: implement
    }

    function M_Transform4 (mat, vec)
    {
        const matX = M_Vec4(mat[0], mat[4], mat[8], mat[12]);
        const matY = M_Vec4(mat[1], mat[5], mat[9], mat[13]);
        const matZ = M_Vec4(mat[2], mat[6], mat[10], mat[14]);
        const matW = M_Vec4(mat[3], mat[7], mat[11], mat[15]);
        return M_Vec4(M_Dot4(matX, vec), M_Dot4(matY, vec), M_Dot4(matZ, vec),
                      M_Dot4(matW, vec));
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
