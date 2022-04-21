/*
 *  r_screen.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The frontend for the rendering.
 *
 *      Exposes some routines for setting up an HTML5 `canvas` element, as well
 *      as for clearing, and flushing the frame buffer onto the actual screen
 *      for the rendering backend to operate on.
 */

(function ()
{
    const screen = document.getElementById("canvas");
    const ctx = screen.getContext("2d");

    let screenW, screenH;
    let screenBuffer;

    function R_FlushBuffer ()
    {
        ctx.putImageData(screenBuffer, 0, 0);
    }

    function R_SetBuffer ()
    {
        screenBuffer = ctx.getImageData(0, 0, screenW, screenH);
        return screenBuffer;
    }

    function R_InitBuffer (w, h)
    {
        screenW = w; screenH = h;
        screen.width = screenW; screen.height = screenH;
        return R_SetBuffer();
    }

    function R_ClearBuffer ()
    {
        ctx.clearRect(0, 0, screenW, screenH);
        return R_SetBuffer();
    }

    window.__import__R_Screen = function ()
    {
        return {
            R_ScreenElement: screen,
            R_Ctx: ctx,
            R_FlushBuffer: R_FlushBuffer,
            R_InitBuffer: R_InitBuffer,
            R_ClearBuffer: R_ClearBuffer,
        };
    };
})();
