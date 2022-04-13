/*
 *  m_math.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *       Various math utilities.
 */

(function ()
{
    const PI_2 = Math.PI * 0.5;
    const TWO_PI = Math.PI * 2;
    const DEG_IN_RAD = 180 / Math.PI;

    function M_RadToDeg (radian)
    {
        return (((radian % TWO_PI) + TWO_PI) % TWO_PI) * DEG_IN_RAD;
    }

    function M_Clamp (number, lower, upper)
    {
        return Math.min(Math.max(number, lower), upper);
    }

    function M_ToFixedDigits (number, nDigits)
    {
        const orderOfMag = Math.pow(10, nDigits || 1);
        return Math.round(number * orderOfMag) / orderOfMag;
    }

    window.__import__M_Math = function ()
    {
        return {
            M_PI_2: PI_2,
            M_RadToDeg,
            M_Clamp: M_Clamp,
            M_ToFixedDigits: M_ToFixedDigits,
        };
    };
})();
