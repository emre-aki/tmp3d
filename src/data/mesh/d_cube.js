/*
 *  d_cube.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-07-08.
 *
 *  SYNOPSIS:
 *      The initial 3-D geometry data and their respective UV mappings.
 */

(function ()
{
    function D_Vertices ()
    {
        return [
            [-10, -10, -10],
            [10, -10, -10],
            [10, 10, -10],
            [-10, 10, -10],
            [-10, -10, 10],
            [10, -10, 10],
            [10, 10, 10],
            [-10, 10, 10]
        ];
    }

    function D_UV ()
    {
        return [
            [0, 0],
            [0, 1],
            [1, 0],
            [1, 1]
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
            [2, 7, 6]
        ];
    }

    function D_UVMap ()
    {
        return [
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"],
            [0, 1, 2, "wood"],
            [2, 1, 3, "wood"]
        ];
    }

    function D_TextureAtlas ()
    {
        return {
            "wood": "models/tmp3dcube/wood.png"
        };
    }

    window.__import__D_Mesh = function ()
    {
        return {
            D_Vertices: D_Vertices,
            D_UV: D_UV,
            D_Triangles: D_Triangles,
            D_UVMap: D_UVMap,
            D_TextureAtlas: D_TextureAtlas,
        };
    };
})();
