/*
 *  d_textures.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-05-03.
 *
 *  SYNOPSIS:
 *      Lookup tables for "global" textures.
 */

(function ()
{
    const TEXTURE_ID_TABLE = D_GlobTextureIdTable();

    function D_GlobTextureIdTable ()
    {
        return { TITLE_TMP3D: "TITLE_TMP3D" };
    }

    function D_GlobTextureFilenameTable ()
    {
        return { [TEXTURE_ID_TABLE.TITLE_TMP3D]: "textures/tmp3d_2x.png" };
    }

    window.__import__D_GlobTextures = function ()
    {
        return {
            D_GlobTextureIdTable: D_GlobTextureIdTable(),
            D_GlobTextureFilenameTable: D_GlobTextureFilenameTable(),
        };
    };
})();
