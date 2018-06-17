/**
 * Formats timestamp
 * 
 * @param {Date} timestamp 
 */
export const formatTimestamp = (timestamp) => {
    return `${ timestamp.getFullYear().toString() }-${ dateToString(timestamp.getMonth() + 1) }-${ dateToString(timestamp.getDate()) } ${ dateToString(timestamp.getHours()) }:${ dateToString(timestamp.getMinutes()) }:${ dateToString(timestamp.getSeconds()) }`;
}

/**
 * Converts date object to string
 * For internal use only
 * 
 * @param {number} res 
 */
const dateToString = (res) => {
    return (res < 10 ? '0' : '') + res; 
}