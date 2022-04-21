/*
 *  g_const.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *       Some common constant values that will not change during the entire
 *       lifetime of the engine.
 */

(function ()
{
    const SCREEN_W = 640, SCREEN_H = 480;
    const ASPECT = SCREEN_W / SCREEN_H;
    const BRUSH_W = 1, BRUSH_H = 1;

    const FOV_Y = Math.PI / 3;
    const FOV_X = ASPECT * FOV_Y;

    const FPS = 30;

    window.__import__G_Const = function ()
    {
        return {
            FPS: FPS,
            FOV_X: FOV_X,
            FOV_Y: FOV_Y,
            SCREEN_W: SCREEN_W,
            SCREEN_H: SCREEN_H,
            ASPECT: ASPECT,
            BRUSH_W: BRUSH_W,
            BRUSH_H: BRUSH_H,
        };
    };
})();
