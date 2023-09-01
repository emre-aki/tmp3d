/*
 *  m_math.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *       Various math utilities.
 */

(function (): void
{
    const PI_2 = Math.PI * 0.5;
    const TWO_PI = Math.PI * 2;
    const DEG_IN_RAD = 180 / Math.PI;

    function M_RadToDeg (radian: number): number
    {
        return (((radian % TWO_PI) + TWO_PI) % TWO_PI) * DEG_IN_RAD;
    }

    function M_Clamp (number: number, lower: number, upper: number): number
    {
        return Math.min(Math.max(number, lower), upper);
    }

    function M_ToFixedDigits (number: number, nDigits: number): number
    {
        const orderOfMag = Math.pow(10, nDigits || 1);

        return Math.round(number * orderOfMag) / orderOfMag;
    }

    function M_FastSign (number: number): number
    {
        return (number >> 31) - (-number >> 31);
    }

    window.__import__M_Math = function ()
    {
        return { PI_2, M_RadToDeg, M_Clamp, M_ToFixedDigits, M_FastSign };
    };
})();
