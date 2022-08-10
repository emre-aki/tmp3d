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
    const SCREEN_W_2 = SCREEN_W * 0.5, SCREEN_H_2 = SCREEN_H * 0.5;
    const ASPECT = SCREEN_W / SCREEN_H;

    const FOV_Y = Math.PI / 3, TAN_FOV_Y_2 = Math.tan(FOV_Y * 0.5);
    const FOV_X = 2 * Math.atan(ASPECT * TAN_FOV_Y_2);

    const Z_NEAR = 1 / TAN_FOV_Y_2;
    const Z_FAR = 4 * Z_NEAR;

    const FPS = 30;

    window.__import__G_Const = function ()
    {
        return {
            FPS: FPS,
            FOV_X: FOV_X,
            FOV_Y: FOV_Y,
            SCREEN_W: SCREEN_W,
            SCREEN_H: SCREEN_H,
            SCREEN_W_2: SCREEN_W_2,
            SCREEN_H_2: SCREEN_H_2,
            ASPECT: ASPECT,
            Z_NEAR: Z_NEAR,
            Z_FAR: Z_FAR,
        };
    };
})();
