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
    const D_Velocity = 1;

    function D_Eye (): pvec3_t
    {
        return [0, -20, 100];
    }

    window.__import__D_Player = function ()
    {
        return { D_Velocity, D_Eye };
    };
})();
