/*
 *  a_assets.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-05-03.
 *
 *  SYNOPSIS:
 *      The module that allows loading game assets into the memory and accessing
 *      them on-the-fly.
 */

(function ()
{
    const TEXTURES_DIRNAME = "/textures/"; // TODO: should this be here??

    const TEXTURES_LUT = {};

    function A_ToBitmap (texture)
    {
        const textureWidth = texture.width, textureHeight = texture.height;
        const tmpCanvas = document.createElement("canvas");
        const tmpCtx = tmpCanvas.getContext("2d");
        tmpCanvas.width = textureWidth; tmpCanvas.height = textureHeight;
        tmpCtx.drawImage(texture, 0, 0);
        return tmpCtx.getImageData(0, 0, textureWidth, textureHeight).data;
    }

    function A_OnTextureLoad (resolve, texture, id)
    {
        TEXTURES_LUT[id] = {
            id: id,
            bitmap: A_ToBitmap(texture),
            width: texture.width,
            height: texture.height,
        };
        resolve();
    }

    function A_TexturePromise (filename, id)
    {
        return new Promise(function A_TexturePromiseExecutor (resolve, reject)
        {
            const texture = new Image();
            texture.onload = A_OnTextureLoad.bind(texture, resolve,
                                                  texture, id);
            texture.onerror = reject;
            texture.src = TEXTURES_DIRNAME + filename;
        });
    }

    function A_LoadTextures (filenames, ids, numTextures)
    {
        // TODO: throw an error should the `filenames` and `ids` have different
        // lengths, maybe??
        const texturePromises = Array(numTextures);
        for (let i = 0; i < numTextures; ++i)
            texturePromises[i] = A_TexturePromise(filenames[i], ids[i]);
        return Promise.all(texturePromises);
    }

    function A_Texture (id)
    {
        return TEXTURES_LUT[id];
    }

    window.__import__A_Assets = function ()
    {
        return { A_LoadTextures: A_LoadTextures, A_Texture: A_Texture };
    };
})();
