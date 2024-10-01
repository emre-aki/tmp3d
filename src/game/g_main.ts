/*
 *  g_main.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *       The main program--the entry-point of the engine.
 */

(function (): void
{
    const { G_Setup } = __import__G_Setup();

    const { G_Run } = __import__G_Run();

    G_Setup().then(G_Run);
})();
