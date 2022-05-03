/*
 *  d_textures.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-05-03.
 *
 *  SYNOPSIS:
 *      Texture lookup tables.
 */

(function ()
{
    const TEXTURE_ID_TABLE = D_TextureIdTable();

    function D_TextureIdTable ()
    {
        return {
            /* misc. */
            TITLE_TMP3D: "TITLE_TMP3D",
        };
    }

    function D_TextureFilenameTable ()
    {
        return {
            [TEXTURE_ID_TABLE.TITLE_TMP3D]: "tmp3d_2x.png",
        };
    }

    window.__import__D_Textures = function ()
    {
        return {
            D_TextureIdTable: D_TextureIdTable(),
            D_TextureFilenameTable: D_TextureFilenameTable(),
        };
    };
})();
