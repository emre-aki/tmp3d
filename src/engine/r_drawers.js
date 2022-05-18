/*
 *  r_drawers.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-05-03.
 *
 *  SYNOPSIS:
 *     Module that houses some static drawer routines that render various
 *     menus, screens, etc.
 */

(function ()
{
    const AN_Animation = __import__AN_Animation();
    const AN_StartAnimation = AN_Animation.AN_StartAnimation;

    const G_Const = __import__G_Const();
    const SCREEN_W = G_Const.SCREEN_W, SCREEN_H = G_Const.SCREEN_H;
    const SCREEN_W_2 = SCREEN_W * 0.5, SCREEN_H_2 = SCREEN_H * 0.5;

    const R_Draw = __import__R_Draw();
    const R_DrawImage = R_Draw.R_DrawImage;
    const R_FillRect = R_Draw.R_FillRect;
    const R_Print = R_Draw.R_Print;

    const R_Screen = __import__R_Screen();
    const R_Ctx = R_Screen.R_Ctx;
    const R_FlushBuffer = R_Screen.R_FlushBuffer;

    const N_LOADING_STATES = 4, LOADING_INTERVAL = 375;
    const LOADING_FONT_COLOR = "#FFFFFF";
    const LOADING_FONT_SIZE = 36;

    const TITLE_INTERVAL = 375;
    const TITLE_FONT_COLOR = "#FFFFFF";
    const TITLE_PRIMARY_FONT_SIZE = 32, TITLE_SECONDARY_FONT_SIZE = 16;

    const ERROR_PREFIX = "fatal error: ";
    const ERROR_FONT_COLOR = "#FF0000";
    const ERROR_FONT_SIZE = 16;

    function R_DrawLoadingFrame (index)
    {
        const dots = Array(index % N_LOADING_STATES).fill(".").join("");
        R_Ctx.fillStyle = "#000000";
        R_Ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        R_Print("Loading" + dots, SCREEN_W_2 - 75, SCREEN_H_2,
                LOADING_FONT_COLOR, LOADING_FONT_SIZE);
    }

    function R_LoadingDrawer (onEnd)
    {
        return AN_StartAnimation(R_DrawLoadingFrame, LOADING_INTERVAL,
                                 undefined, onEnd);
    }

    function R_DrawTitleFrame (index, decor)
    {
        R_FillRect(0, 0, SCREEN_W, SCREEN_H, 0, 0, 0, 255);
        R_DrawImage(decor,
                    0, 0, decor.width, decor.height,
                    SCREEN_W_2 - 100, SCREEN_H_2 - 217,
                    decor.width, decor.height);
        R_FlushBuffer();
        R_Print("Tmp3D Engine", SCREEN_W_2 - 117, SCREEN_H_2 + 20,
                TITLE_FONT_COLOR, TITLE_PRIMARY_FONT_SIZE);
        R_Print("v" + __VERSION__, SCREEN_W_2 - 30, SCREEN_H_2 + 44,
                TITLE_FONT_COLOR, TITLE_SECONDARY_FONT_SIZE);
        R_Print("by Emre Akı, 2022.", SCREEN_W_2 - 86, SCREEN_H_2 + 87,
                TITLE_FONT_COLOR, TITLE_SECONDARY_FONT_SIZE);
        if (index & 1)
            R_Print("Press any key to start", SCREEN_W_2 - 106, SCREEN_H - 50,
                    TITLE_FONT_COLOR, TITLE_SECONDARY_FONT_SIZE);
    }

    function R_TitleDrawer (decor, onEnd)
    {
        return AN_StartAnimation(function R_OnTitleFrame (index)
        {
            R_DrawTitleFrame(index, decor);
        }, TITLE_INTERVAL, undefined, onEnd);
    }

    function R_ErrorDrawer (reason)
    {
        R_Ctx.fillStyle = "#000000";
        R_Ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
        R_Print(ERROR_PREFIX + reason, 50, SCREEN_H - 50,
                ERROR_FONT_COLOR, ERROR_FONT_SIZE);
    }

    window.__import__R_Drawers = function ()
    {
        return {
            R_LoadingDrawer: R_LoadingDrawer,
            R_TitleDrawer: R_TitleDrawer,
            R_ErrorDrawer: R_ErrorDrawer,
        };
    };
})();
