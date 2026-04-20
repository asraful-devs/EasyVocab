const pick = <T extends Record<string, any>, K extends keyof T>(
    obj: T,
    keys: K[]
): Partial<T> => {
    const finalObject: Partial<T> = {};

    for (const key of keys) {
        if (obj && Object.prototype.hasOwnProperty.call(obj, key)) {
            finalObject[key] = obj[key];
        }
    }
    // console.log(finalObject);
    return finalObject;
};
export default pick;
