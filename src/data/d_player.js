/*
 *  d_player.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      Initial player data.
 */

(function ()
{
    const VELOCITY = 1;

    function D_Eye ()
    {
        return [0, 0, 10];
    }

    window.__import__D_Player = function ()
    {
        return { D_Velocity: VELOCITY, D_Eye: D_Eye };
    };
})();
