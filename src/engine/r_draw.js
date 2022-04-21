/*
 *  r_draw.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      The rendering backend.
 *
 *      The module that helps draw some geometric primitives, as well as other
 *      more advanced visual effects, directly onto the frame buffer.
 */

(function ()
{
    const G_Const = __import__G_Const();
    const BRUSH_W = G_Const.BRUSH_W, BRUSH_H = G_Const.BRUSH_H;

    const M_Math = __import__M_Math();
    const M_Clamp = M_Math.M_Clamp;

    const R_Screen = __import__R_Screen();
    const R_Ctx = R_Screen.R_Ctx;

    let frameBuffer;

    function R_SetFrameBuffer (buffer)
    {
        frameBuffer = buffer;
    }

    function R_FillRect (x, y, w, h, r, g, b, a)
    {
        const frameBufferWidth = frameBuffer.width;
        const frameBufferHeight = frameBuffer.height
        const sX = M_Clamp(Math.floor(x), 0, frameBufferWidth);
        const sY = M_Clamp(Math.floor(y), 0, frameBufferHeight);
        const dX = M_Clamp(Math.floor(x + w), 0, frameBufferWidth);
        const dY = M_Clamp(Math.floor(y + h), 0, frameBufferHeight);
        for (let brushY = sY; brushY < dY; ++brushY)
        {
            for (let brushX = sX; brushX < dX; ++brushX)
            {
                const pixIndex = 4 * (frameBufferWidth * brushY + brushX);
                const bufferRed = frameBuffer.data[pixIndex];
                const bufferGreen = frameBuffer.data[pixIndex + 1];
                const bufferBlue = frameBuffer.data[pixIndex + 2];
                const bufferAlpha = frameBuffer.data[pixIndex + 3] || 255;
                const blend = a / bufferAlpha, blendInv = 1 - blend;
                const newRed = blend * r + blendInv * bufferRed;
                const newGreen = blend * g + blendInv * bufferGreen;
                const newBlue = blend * b + blendInv * bufferBlue;
                frameBuffer.data[pixIndex] = newRed;
                frameBuffer.data[pixIndex + 1] = newGreen;
                frameBuffer.data[pixIndex + 2] = newBlue;
                frameBuffer.data[pixIndex + 3] = 255;
            }
        }
    }

    function R_DrawLine (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const strokeX = stroke || BRUSH_W, strokeY = stroke || BRUSH_H;
        const sX = Math.floor(sx), sY = Math.floor(sy);
        const dX = Math.floor(dx), dY = Math.floor(dy);
        const deltaX = dX - sX, deltaY = dY - sY;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const slope = deltaY / deltaX, slopeInverse = deltaX / deltaY;
        const stepInXHorizontal = strokeX * dirX;
        const stepInYHorizontal = strokeX * dirX * slope;
        const stepInXVertical = strokeX * dirY * slopeInverse;
        const stepInYVertical = strokeWithDirY = strokeY * dirY;
        if (stepInXHorizontal)
        {
            for (let x = sX, y = sY;
                 (dX - x) * dirX >= 0;
                  x += stepInXHorizontal)
            {
                const Y = Math.floor(y);
                R_FillRect(x, Y, strokeX, strokeY, r, g, b, a);
                y += stepInYHorizontal;
            }
        }
        if (stepInYVertical)
        {
            for (let x = sX, y = sY; (dY - y) * dirY >= 0; y += stepInYVertical)
            {
                const X = Math.floor(x);
                R_FillRect(X, y, strokeX, strokeY, r, g, b, a);
                x += stepInXVertical;
            }
        }
    }

    function
    R_DrawTriangleWireframe
    ( ax, ay,
      bx, by,
      cx, cy,
      r, g, b, a,
      stroke )
    {
        R_DrawLine(ax, ay, bx, by, r, g, b, a, stroke);
        R_DrawLine(ax, ay, cx, cy, r, g, b, a, stroke);
        R_DrawLine(bx, by, cx, cy, r, g, b, a, stroke);
    }

    function R_Print (chars, x, y, color, size, fontFamily, style)
    {
        R_Ctx.font = (style ? style + " " : "") +
                     (Number.isFinite(size) ? size : 10).toString() + "px " +
                     (fontFamily ? fontFamily : "Courier");
        R_Ctx.fillStyle = color || "#000000";
        R_Ctx.fillText(chars, x, y);
    }

    function R_FillTriangle (ax, ay, bx, by, cx, cy, r, g, b, a)
    {
        // TODO: implement
    }

    window.__import__R_Draw = function ()
    {
        return {
            R_SetFrameBuffer: R_SetFrameBuffer,
            R_DrawLine: R_DrawLine,
            R_DrawTriangleWireframe: R_DrawTriangleWireframe,
            R_FillTriangle: R_FillTriangle,
            R_Print: R_Print,
        };
    };
})();
