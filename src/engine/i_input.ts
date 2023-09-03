/*
 *  i_input.ts
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-02-13.
 *
 *  SYNOPSIS:
 *      Manage player input on keyboard and mouse.
 */

(function (): void
{
    const KEY = {
        /* standard keys */
        A: "A",
        D: "D",
        E: "E",
        G: "G",
        Q: "Q",
        R: "R",
        S: "S",
        W: "W",
        /* arrow keys */
        ARW_DOWN: "ARW_DOWN",
        ARW_LEFT: "ARW_LEFT",
        ARW_RIGHT: "ARW_RIGHT",
        ARW_UP: "ARW_UP",
        /* special keys */
        RTN: "RTN",
        SPC: "SPC",
    } as const;

    const KEY_CODES = {
        Enter: KEY.RTN,
        Space: KEY.SPC,
        ArrowLeft: KEY.ARW_LEFT,
        ArrowUp: KEY.ARW_UP,
        ArrowRight: KEY.ARW_RIGHT,
        ArrowDown: KEY.ARW_DOWN,
        KeyA: KEY.A,
        KeyD: KEY.D,
        KeyE: KEY.E,
        KeyG: KEY.G,
        KeyW: KEY.W,
        KeyQ: KEY.Q,
        KeyR: KEY.R,
        KeyS: KEY.S,
    } as const;

    const MOUSE = {
        LEFT: "LEFT",
        MIDDLE: "MIDDLE",
        RIGHT: "RIGHT",
        BRWS_BWD: "BRWS_BWD",
        BRWS_FWD: "BRWS_FWD",
        MOVING: "MOVING",
        MOVEMENT_X: "MOVEMENT_X",
        MOVEMENT_Y: "MOVEMENT_Y",
        WHEELING: "WHEELING",
        DELTA_WHEEL: "DELTA_WHEEL",
    } as const;

    const MOUSE_CODES = [
        MOUSE.LEFT,
        MOUSE.MIDDLE,
        MOUSE.RIGHT,
        MOUSE.BRWS_BWD,
        MOUSE.BRWS_FWD,
     ] as const;

    const keyState: { [key in (keyof KEY)]: 0 | 1 } = {
        [KEY.A]: 0,
        [KEY.D]: 0,
        [KEY.E]: 0,
        [KEY.G]: 0,
        [KEY.Q]: 0,
        [KEY.R]: 0,
        [KEY.S]: 0,
        [KEY.W]: 0,
        [KEY.ARW_DOWN]: 0,
        [KEY.ARW_LEFT]: 0,
        [KEY.ARW_RIGHT]: 0,
        [KEY.ARW_UP]: 0,
        [KEY.RTN]: 0,
        [KEY.SPC]: 0,
    };

    const mouseState: { [key in (keyof MOUSE)]: number } = {
        [MOUSE.LEFT]: 0,
        [MOUSE.MIDDLE]: 0,
        [MOUSE.RIGHT]: 0,
        [MOUSE.BRWS_BWD]: 0,
        [MOUSE.BRWS_FWD]: 0,
        [MOUSE.MOVING]: 0,
        [MOUSE.MOVEMENT_X]: 0,
        [MOUSE.MOVEMENT_Y]: 0,
        [MOUSE.WHEELING]: 0,
        [MOUSE.DELTA_WHEEL]: 0,
    };

    const MOUSE_RESET_DELAY = 100;
    let mouseStopTimeout: number, mouseWheelTimeout: number;

    function I_KeyDown (event: KeyboardEvent): void
    {
        const code = event.code;
        if (code in KEY_CODES)
            keyState[KEY_CODES[code as keyof typeof KEY_CODES]] = 1;
    }

    function I_KeyUp (event: KeyboardEvent): void
    {
        const code = event.code;
        if (code in KEY_CODES)
            keyState[KEY_CODES[code as keyof typeof KEY_CODES]] = 0;
    }

    function I_GetKeyState (key: keyof typeof KEY): 0 | 1
    {
        return keyState[KEY[key]];
    }

    function I_InitKeyboard (onElement: Document | HTMLElement): void
    {
        onElement.onkeydown = I_KeyDown;
        onElement.onkeyup = I_KeyUp;
    }

    function I_MouseDown (event: MouseEvent): void
    {
        const button = event.button;
        if (MOUSE_CODES[button]) mouseState[MOUSE_CODES[button]] = 1;
    }

    function I_MouseUp (event: MouseEvent): void
    {
        const button = event.button;
        if (MOUSE_CODES[button]) mouseState[MOUSE_CODES[button]] = 0;
    }

    function I_ResetMouseMovement (): void
    {
        mouseState.MOVING = 0;
        mouseState.MOVEMENT_X = 0; mouseState.MOVEMENT_Y = 0;
    }

    function I_MouseMove (event: MouseEvent): void
    {
        mouseState.MOVING = 1;
        mouseState.MOVEMENT_X = event.movementX;
        mouseState.MOVEMENT_Y = event.movementY;
        // reset mouse movement after some time has passed
        if (mouseStopTimeout !== undefined) clearTimeout(mouseStopTimeout);
        mouseStopTimeout = setTimeout(I_ResetMouseMovement, MOUSE_RESET_DELAY);
    }

    function I_ResetMouseWheel (): void
    {
        mouseState.WHEELING = 0; mouseState.DELTA_WHEEL = 0;
    }

    function I_MouseWheel (event: WheelEvent): void
    {
        event.preventDefault(); // prevent scrolling the page
        mouseState.WHEELING = 1; mouseState.DELTA_WHEEL = event.deltaY;
        // reset mouse wheel after some time has passed
        if (mouseWheelTimeout !== undefined) clearTimeout(mouseWheelTimeout);
        mouseWheelTimeout = setTimeout(I_ResetMouseWheel, MOUSE_RESET_DELAY);
    }

    function I_PointerLocked (onElement: HTMLElement): boolean
    {
        return document.pointerLockElement === onElement ||
               // @ts-ignore
               document.mozPointerLockElement === onElement;
    }

    function I_RequestPointerLock (onElement: HTMLElement): void
    {
        if (!I_PointerLocked(onElement))
        {
            onElement.requestPointerLock = onElement.requestPointerLock ||
                                           // @ts-ignore
                                           onElement.mozRequestPointerLock;
            onElement.requestPointerLock();
        }
    }

    function I_AttachMouseEventListeners (onElement: HTMLElement): void
    {
        onElement.onclick = null;
        onElement.onmousedown = I_MouseDown;
        onElement.onmouseup = I_MouseUp;
        onElement.onmousemove = I_MouseMove;
        onElement.onwheel = I_MouseWheel;
    }

    function I_DetachMouseEventListeners (fromElement: HTMLElement): void
    {
        fromElement.onclick = I_RequestPointerLock.bind(undefined, fromElement);
        fromElement.onmousedown = null;
        fromElement.onmouseup = null;
        fromElement.onmousemove = null;
        fromElement.onwheel = null;
    }

    function I_PointerLockChange (onElement: HTMLElement): void
    {
      // pointer locked, attach mouse listeners
      if (I_PointerLocked(onElement)) I_AttachMouseEventListeners(onElement);
      // pointer unlocked, detach mouse listeners
      else I_DetachMouseEventListeners(onElement);
    }

    function I_GetMouseState (key: keyof typeof MOUSE): number
    {
        return mouseState[MOUSE[key]];
    }

    function I_InitMouse (onElement: HTMLElement): void
    {
        onElement.onclick = I_RequestPointerLock.bind(undefined, onElement);
        document.onpointerlockchange = I_PointerLockChange.bind(undefined,
                                                                onElement);
        // @ts-ignore
        document.onmozpointerlockchange = I_PointerLockChange.bind(undefined,
                                                                   onElement);
    }

    window.__import__I_Input = function ()
    {
        return {
            I_Keys: KEY,
            I_Mouse: MOUSE,
            I_GetKeyState,
            I_InitKeyboard,
            I_GetMouseState,
            I_InitMouse,
        };
    };
})();
