/*
 *  log.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2023-04-22.
 *
 *  SYNOPSIS:
 *      A module for local runtime logging.
 */

const LOG_LEVEL = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    WARNING: "WARNING",
    ERROR: "ERROR",
};

function Log (level, message, context)
{
    const prefix = `[tmp3d${context ? `-${context}` : ""}]`;
    console.log(`${prefix} ${level}: ${message}`);
}

function LogDebug (message, context)
{
    Log(LOG_LEVEL.DEBUG, message, context);
}

function LogInfo (message, options)
{
    let context, verbose;
    if (options) ({ context, verbose } = options);
    if (!(verbose ?? true)) return;
    Log(LOG_LEVEL.INFO, message, context);
}

function LogWarning (message, context)
{
    Log(LOG_LEVEL.WARNING, message, context);
}

function LogError (message, context)
{
    Log(LOG_LEVEL.ERROR, message, context);
}

exports.LogDebug = LogDebug;
exports.LogInfo = LogInfo;
exports.LogWarning = LogWarning;
exports.LogError = LogError;
