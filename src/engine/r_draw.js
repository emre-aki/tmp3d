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
    const M_Math = __import__M_Math();
    const M_Clamp = M_Math.M_Clamp;

    const R_Screen = __import__R_Screen();
    const R_Ctx = R_Screen.R_Ctx;
    const R_ClearBuffer = R_Screen.R_ClearBuffer;

    let frameBuffer;

    function R_ClearFrameBuffer ()
    {
        frameBuffer = R_ClearBuffer();
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

    function R_DrawLine_DDA (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const sX = Math.floor(sx), sY = Math.floor(sy);
        const dX = Math.floor(dx), dY = Math.floor(dy);
        const deltaX = dX - sX, deltaY = dY - sY;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const slope = deltaY / deltaX, slopeInverse = deltaX / deltaY;
        const strokeInXHorizontal = stroke_ * dirX;
        const stepInYHorizontal = slope * dirX;
        const strokeInYVertical = stroke_ * dirY;
        const stepInXVertical = slopeInverse * dirY;
        if (strokeInXHorizontal)
        {
            for (let x = sX, y = sY;
                 (dX - x) * dirX > 0;
                 x += strokeInXHorizontal)
            {
                const Y = sY + Math.floor(y - sY) * stroke_;
                R_FillRect(x, Y, stroke_, stroke_, r, g, b, a);
                y += stepInYHorizontal;
            }
        }
        if (strokeInYVertical)
        {
            for (let x = sX, y = sY;
                 (dY - y) * dirY > 0;
                 y += strokeInYVertical)
            {
                const X = sX + Math.floor(x - sX) * stroke_;
                R_FillRect(X, y, stroke_, stroke_, r, g, b, a);
                x += stepInXVertical;
            }
        }
    }

    function R_Bresenham_HorizontalSweep (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const deltaX = dx - sx, deltaY = dy - sy;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const strokeX = dirX * stroke_, strokeY = dirY * stroke_;
        // need to fix the signs in the formulae
        const deltaYAbs = deltaY * dirY;
        // the increment for Pk+1, if Pk < 0
        const pIncrementForSameRow = deltaYAbs + deltaYAbs;
        // the increment for Pk+1, if Pk >= 0
        const pIncrementForNextRow = pIncrementForSameRow - deltaX - deltaX;
        // the initial value for the decision parameter, P0
        const p0 = pIncrementForNextRow + deltaX;
        for (let x = sx, y = sy, pK = p0; (dx - x) * dirX >= 0; x += strokeX)
        {
            R_FillRect(x, y, stroke_, stroke_, r, g, b, a);
            if (pK < 0) pK += pIncrementForSameRow;
            else
            {
                pK += pIncrementForNextRow;
                y += strokeY;
            }
        }
    }

    function R_Bresenham_VerticalSweep (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const deltaX = dx - sx, deltaY = dy - sy;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const strokeX = dirX * stroke_, strokeY = dirY * stroke_;
        // need to fix the signs in the formulae
        const deltaXAbs = deltaX * dirX;
        // the increment for Pk+1, if Pk < 0
        const pIncrementForSameCol = deltaXAbs + deltaXAbs;
        // the increment for Pk+1, if Pk >= 0
        const pIncrementForNextCol = pIncrementForSameCol - deltaY - deltaY;
        // the initial value for the decision parameter, P0
        const p0 = pIncrementForNextCol + deltaY;
        for (let x = sx, y = sy, pK = p0; (dy - y) * dirY >= 0; y += strokeY)
        {
            R_FillRect(x, y, stroke_, stroke_, r, g, b, a);
            if (pK < 0) pK += pIncrementForSameCol;
            else
            {
                pK += pIncrementForNextCol;
                x += strokeX;
            }
        }
    }

    function R_DrawLine_Bresenham (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const sX = Math.floor(sx), sY = Math.floor(sy);
        const dX = Math.floor(dx), dY = Math.floor(dy);
        if (sX === dX && sY === dY) return; // early return if nothing to draw
        const isVerticalSweep = Math.abs(dX - sX) < Math.abs(dY - sY);
        /* the x-direction of the line should always be >= 0 */
        if (isVerticalSweep && dY > sY)
            R_Bresenham_VerticalSweep(sX, sY, dX, dY, r, g, b, a, stroke);
        else if (isVerticalSweep)
            R_Bresenham_VerticalSweep(dX, dY, sX, sY, r, g, b, a, stroke);
        else if (dX > sX)
            R_Bresenham_HorizontalSweep(sX, sY, dX, dY, r, g, b, a, stroke);
        else
            R_Bresenham_HorizontalSweep(dX, dY, sX, sY, r, g, b, a, stroke);
    }

    function R_DrawLine_RayCast (sx, sy, dx, dy, r, g, b, a, stroke)
    {
        const stroke_ = stroke || 1;
        const sX = Math.floor(sx), sY = Math.floor(sy);
        const dX = Math.floor(dx), dY = Math.floor(dy);
        if (sX === dX && sY === dY) return; // early return if nothing to draw
        const deltaX = dX - sX, deltaY = dY - sY;
        const dirX = Math.sign(deltaX), dirY = Math.sign(deltaY);
        const slope = deltaY / deltaX, slopeInverse = deltaX / deltaY;
        const stepVerticalY = dirX * slope;
        const stepHorizontalX = dirY * slopeInverse;
        const strokeXVertical = dirX * stroke_;
        const strokeYVertical = stepVerticalY * stroke_;
        const strokeXHorizontal = stepHorizontalX * stroke_;
        const strokeYHorizontal = dirY * stroke_;
        const lineLength = (dx - sx) * (dx - sx) + (dy - sy) * (dy - sy);
        let currentLength = 0;
        let x = sX, y = sY;
        let traceVerticalX = dirX > 0 ? Math.floor(sx + 1) : sX;
        let traceVerticalY = sy + (traceVerticalX - sx) * slope;
        let traceHorizontalY = dirY > 0 ? Math.floor(sy + 1) : sY;
        let traceHorizontalX = sx + (traceHorizontalY - sy) * slopeInverse;
        let advanceVertically;
        while (currentLength < lineLength)
        {
            R_FillRect(x, y, stroke_, stroke_, r, g, b, a);
            const verticalDistInX = traceVerticalX - sx;
            const verticalDistInY = traceVerticalY - sy;
            const horizontalDistInX = traceHorizontalX - sx;
            const horizontalDistInY = traceHorizontalY - sy;
            const distVertical = verticalDistInX * verticalDistInX +
                                 verticalDistInY * verticalDistInY;
            const distHorizontal = horizontalDistInX * horizontalDistInX +
                                   horizontalDistInY * horizontalDistInY;
            advanceVertically = Number.isNaN(distVertical) ||
                                distVertical > distHorizontal
                                    ? 0 : distVertical === distHorizontal
                                        ? advanceVertically : 1;
            currentLength = advanceVertically ? distVertical : distHorizontal;
            if (advanceVertically)
            {
                x += strokeXVertical;
                traceVerticalX += strokeXVertical;
                traceVerticalY += strokeYVertical;
            }
            else
            {
                y += strokeYHorizontal;
                traceHorizontalX += strokeXHorizontal;
                traceHorizontalY += strokeYHorizontal;
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
        R_DrawLine_Bresenham(ax, ay, bx, by, r, g, b, a, stroke);
        R_DrawLine_Bresenham(ax, ay, cx, cy, r, g, b, a, stroke);
        R_DrawLine_Bresenham(bx, by, cx, cy, r, g, b, a, stroke);
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
            R_ClearFrameBuffer: R_ClearFrameBuffer,
            R_DrawLine_DDA: R_DrawLine_DDA,
            R_DrawLine_Bresenham: R_DrawLine_Bresenham,
            R_DrawLine_RayCast: R_DrawLine_RayCast,
            R_DrawTriangleWireframe: R_DrawTriangleWireframe,
            R_FillTriangle: R_FillTriangle,
            R_Print: R_Print,
        };
    };
})();
