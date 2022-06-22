/*
 *  d_mesh.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The initial 3-D geometry data and their respective UV mappings.
 */

(function ()
{
    // TODO: make this module into an `.obj` file loader

    function D_Vertices ()
    {
        return [
            /* 0 */ [-10, -10, 10],
            /* 1 */ [10, -10, 10],
            /* 2 */ [10, 10, 10],
            /* 3 */ [-10, 10, 10],
            /* 4 */ [-10, -10, 30],
            /* 5 */ [10, -10, 30],
            /* 6 */ [10, 10, 30],
            /* 7 */ [-10, 10, 30],
        ];
    }

    function D_UV ()
    {
        return [
            /* 0 */ [0, 0],
            /* 1 */ [0, 1],
            /* 2 */ [1, 0],
            /* 3 */ [1, 1],
        ];
    }

    function D_Triangles ()
    {
        return [
            [0, 3, 1],
            [1, 3, 2],
            [4, 7, 0],
            [0, 7, 3],
            [5, 6, 4],
            [4, 6, 7],
            [1, 2, 5],
            [5, 2, 6],
            [4, 0, 5],
            [5, 0, 1],
            [3, 7, 2],
            [2, 7, 6],
        ];
    }

    function D_UVMap ()
    {
        return [
            [0, 1, 2],
            [2, 1, 3],
            [0, 1, 2],
            [2, 1, 3],
            [0, 1, 2],
            [2, 1, 3],
            [0, 1, 2],
            [2, 1, 3],
            [0, 1, 2],
            [2, 1, 3],
            [0, 1, 2],
            [2, 1, 3],
        ];
    }

    window.__import__D_Mesh = function ()
    {
        return {
            D_Vertices: D_Vertices,
            D_UV: D_UV,
            D_Triangles: D_Triangles,
            D_UVMap: D_UVMap,
        };
    };
})();
