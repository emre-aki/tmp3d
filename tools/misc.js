/*
 *  misc.js
 *  tmp3d
 *
 *  Created by Emre Akı on 2022-07-03.
 *
 *  SYNOPSIS:
 *      Miscellaneous tools & utilities.
 */

function ArrayToStr (array)
{
    return `[${array.join(", ")}]`;
}

function DateToStr (date)
{
    const year = date.getFullYear();
    const month = `${(date.getMonth() + 1)}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
}

exports.ArrayToStr = ArrayToStr;
exports.DateToStr = DateToStr;
