/**
 * It maps the values of the itterable to the promises produced by the mapper gradually while maintaining a set number of parallel pending promises.
 *
 * @export
 * @param {Iterable} itterable The values to be mapped to promises
 * @param {Function} mapper The function that produces the promises
 * @param {number} [concurrency=2] Maximum parallel pending promises
 * @param {number} [retryTimeout=6000] Frequency of checking wether pending promises settled
 * @param {boolean} [abortAfterFirst=false] If set to tru it will reject all promises after the first resolved one. Usefull for Promise.any
 * @returns {Array<Promise>} The array of resulting promises.
 */
export default function* (itterable, mapper, concurrency = 2, retryTimeout = 6000, abortAfterFirst = false) {

    let ongoing = 0

    const controller = new AbortController()

    async function throttledPromise (value) {
        if((ongoing < concurrency) && !controller.signal.aborted) {
            try {
                ongoing++
                const result = await mapper(value)
                if (controller.signal.aborted) throw 'aborted' //Just in case the queue was aborted while `awaait` was pending.
                if (abortAfterFirst) controller.abort()
                return result
            } finally {
                ongoing--
            }
        } else if (!controller.signal.aborted){
            await new Promise((res, rej)=>setTimeout(res, retryTimeout)) //delay
            return await throttledPromise(value) //Recursion
        } else {
            throw 'aborted'
        }
    }
    
    for (const value of itterable) {
        yield throttledPromise(value)
    }
}