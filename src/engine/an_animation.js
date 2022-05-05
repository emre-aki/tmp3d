/*
 *  an_animation.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-05-04.
 *
 *  SYNOPSIS:
 *      The module for animating various in-engine objects.
 */

(function ()
{
    const runningAnimations = {}, queuedAnimations = {};

    function AN_GenerateAnimationId (candidateId, goingIntoQueue)
    {
        const candidate = candidateId || "(anonymous)";
        if (goingIntoQueue)
            return queuedAnimations[candidate]
                ? AN_GenerateAnimationId(candidate + "_1")
                : candidate;
        else
            return runningAnimations[candidate]
                ? AN_GenerateAnimationId(candidate + "_1")
                : candidate;
    }

    function AN_CancelAnimation (id, cleanUp)
    {
        clearInterval(runningAnimations[id]);
        delete runningAnimations[id];
        if (cleanUp) cleanUp();
    }

    function AN_StartAnimation (onFrame, interval, shouldEnd, cleanUp)
    {
        const id = AN_GenerateAnimationId(arguments.callee.caller.name);
        let index = 0;

        function AN_OnFrame ()
        {
            if (shouldEnd && shouldEnd(index)) AN_CancelAnimation(id, cleanUp);
            else onFrame(index);
            ++index;
        }

        runningAnimations[id] = setInterval(AN_OnFrame, interval);
        return id;
    }

    function AN_QueueAnimation (onFrame, interval, shouldEnd, cleanUp)
    {
        const id = AN_GenerateAnimationId(arguments.callee.caller.name, 1);
        let index = 0;

        function AN_OnFrame ()
        {
            if (shouldEnd && shouldEnd(index)) AN_CancelAnimation(id, cleanUp);
            else onFrame(index);
            ++index;
        }

        queuedAnimations[id] = { onFrame: AN_OnFrame, interval: interval };
        return id;
    }

    function AN_RunQueuedAnimation (id)
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
