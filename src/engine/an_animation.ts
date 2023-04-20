/*
 *  an_animation.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-05-04.
 *
 *  SYNOPSIS:
 *      The module for animating various in-engine objects.
 */

(function (): void
{
    const runningAnimations: RunningAnimationTable = {};
    const queuedAnimations: QueuedAnimationTable = {};

    type AN_OnFrameArgs = {
        animationIndex: Uint32Array,
        id: string,
        onFrame: (animationIndex: number) => void,
        shouldEnd?: (animationIndex: number) => boolean,
        cleanUp?: () => void
    };

    function
    AN_GenerateAnimationId
    ( candidateId: string,
      goingIntoQueue?: 1 ): string
    {
        const candidate = candidateId || "(anonymous)";
        if (goingIntoQueue)
            return queuedAnimations[candidate]
                ? AN_GenerateAnimationId(candidate + "_1")
                : candidate;

        return runningAnimations[candidate]
            ? AN_GenerateAnimationId(candidate + "_1")
            : candidate;
    }

    function AN_CancelAnimation (id: string, cleanUp?: () => void): void
    {
        clearInterval(runningAnimations[id]);
        delete runningAnimations[id];
        if (cleanUp) cleanUp();
    }

    function
    AN_OnFrame
    ( { animationIndex,
        id,
        onFrame,
        shouldEnd,
        cleanUp }: AN_OnFrameArgs ): void
    {
        const index = animationIndex[0]++;
        if (shouldEnd && shouldEnd(index)) AN_CancelAnimation(id, cleanUp);
        else onFrame(index);
    }

    function
    AN_StartAnimation
    ( onFrame: (animationIndex: number) => void,
      interval: number,
      shouldEnd?: (animationIndex: number) => boolean,
      cleanUp?: () => void ): string
    {
        const id = AN_GenerateAnimationId(arguments.callee.caller.name);
        const animationIndex = new Uint32Array(1);
        const args = { animationIndex, id, onFrame, shouldEnd, cleanUp };
        runningAnimations[id] = setInterval(AN_OnFrame, interval, args);

        return id;
    }

    function
    AN_QueueAnimation
    ( onFrame: (animationIndex: number) => void,
      interval: number,
      shouldEnd?: (animationIndex: number) => boolean,
      cleanUp?: () => void ): string
    {
        const id = AN_GenerateAnimationId(arguments.callee.caller.name, 1);
        const animationIndex = new Uint32Array(1);
        const args = { animationIndex, id, onFrame, shouldEnd, cleanUp };
        const boundOnFrame = AN_OnFrame.bind(undefined, args);
        queuedAnimations[id] = { onFrame: boundOnFrame, interval };

        return id;
    }

    function AN_RunQueuedAnimation (id: string): void
    {
        const animation = queuedAnimations[id];
        if (!animation) return;
        const onFrame = animation.onFrame, interval = animation.interval;
        runningAnimations[id] = setInterval(onFrame, interval);
        delete queuedAnimations[id];
    }

    window.__import__AN_Animation = function ()
    {
        return {
            AN_StartAnimation: AN_StartAnimation,
            AN_CancelAnimation: AN_CancelAnimation,
            AN_QueueAnimation: AN_QueueAnimation,
            AN_RunQueuedAnimation: AN_RunQueuedAnimation,
        };
    };
})();
