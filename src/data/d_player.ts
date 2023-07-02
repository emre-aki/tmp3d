/*
 *  d_player.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      Initial player data.
 */

(function (): void
{
    const VELOCITY = 1;

    function D_Eye (): pvec3_t
    {
        return [-105, -3, 366];
    }

    window.__import__D_Player = function ()
    {
        return { D_Velocity: VELOCITY, D_Eye: D_Eye };
    };
})();
