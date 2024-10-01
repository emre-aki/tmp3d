/*
 *  g_const.ts
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
    const { M_Vec3: Vec3 } = __import__M_Vec3();

    const { M_AABB3: AABB3 } = __import__M_AABB3();

    const SCREEN_W = 640, SCREEN_H = 480;
    const SCREEN_W_2 = SCREEN_W * 0.5, SCREEN_H_2 = SCREEN_H * 0.5;
    const ASPECT = SCREEN_W / SCREEN_H;

    const FOV_Y = Math.PI / 3, TAN_FOV_Y_2 = Math.tan(FOV_Y * 0.5);
    const FOV_X = 2 * Math.atan(ASPECT * TAN_FOV_Y_2);

    const MAX_MOV_TILT = Math.PI / 90;

    const NEAR_H = 2, NEAR_W = ASPECT * NEAR_H;
    const Z_NEAR = NEAR_H / (2 * TAN_FOV_Y_2), Z_FAR = 500 * Z_NEAR;
    const FAR_W = Z_FAR / Z_NEAR * NEAR_W, FAR_W_2 = FAR_W * 0.5;
    const FAR_H = FAR_W / ASPECT, FAR_H_2 = FAR_H * 0.5;

    const FPS = 30;

    const FRUSTUM_AABB3 = AABB3(Vec3(-FAR_W_2, -FAR_H_2, Z_NEAR),
                                Vec3(FAR_W, FAR_H, Z_FAR - Z_NEAR));

    window.__import__G_Const = function ()
    {
        return {
            FPS,
            FOV_X,
            FOV_Y,
            MAX_MOV_TILT,
            SCREEN_W,
            SCREEN_H,
            SCREEN_W_2,
            SCREEN_H_2,
            ASPECT,
            Z_NEAR,
            Z_FAR,
            FRUSTUM_AABB3,
        };
    };
})();
