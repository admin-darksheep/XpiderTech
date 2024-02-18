/**
* utils/merger.js - File responsible for merging data.
* Developer: Abdul Ahad
* Last Updated: Abdul Ahad
* This code follows the GNU General Public License (Version 3).
* Brand: XpiderTech
*/
(function(globalNS, factory) {
    if ("undefined" !== typeof module && "object" === typeof module?.exports) {
        module.exports = factory();
    } else if ("object" === typeof globalNS.window) {
        window.Merger = factory();
    }
})(("undefined" !== typeof self && self !== null && "object" === typeof self)? self: this, function() {
    class Merger {
        static merge = merge;
        static deepClone = deepClone;
        constructor(value, options) {
            this._value = value?? {};
            this._options = options?? {};
        }
        get #seen() {
            return new WeakSet();
        }
        get clone() {
            return Merger.deepClone(this._value);
        }
        set source(source) {
            this._value = Merger.merge(this._value, source, this._options, this.seen);
        }
        get target() {
            return this._value;
        }
        set options(options) {
            Merger.merge(this._options, options);
        }
        get options() {
            return {
                ...this._options
            };
        }
        get instance() {
            return new Merger(this.clone, this.options);
        }
        mergeAll() {
            Array.prototype.forEach.call(arguments, (source)=> {
                this.source = source;
            })
        }

    }
    function merge(target, source, options = {}, seen = new WeakSet(), recursiveDepth = 0) {

        if (seen.has(source) && recursiveDepth !== 0) {
            return source;
        }
        seen.add(source);
        seen.add(target);
        if (areValidObject(source)) {
            const keys = ownKeys(source, options);
            for (const key of keys) {
                const sourceValue = source[key];
                const value = (((options?.string?.concat && areString(target[key], sourceValue)) || (options?.array?.concat && areArray(target[key], sourceValue)))?target[key].concat(sourceValue): (options?.set?.concat && areSet(target[key], sourceValue))?new Set([...target[key], ...sourceValue]): (options?.map?.concat && areMap(target[key], sourceValue))?new Map([...target[key], ...sourceValue]): sourceValue);

                const descriptor = Object.getOwnPropertyDescriptor(source, key);
                if (target[key] !== value) {

                    defineProperty(target, key, {
                        ...descriptor, 'value': areValidObject(value)?merge((target[key]?? {}), value, options, seen, recursiveDepth+1): value
                    }, options);
                }
            }
        }

        return target;
    }
    function deepClone(source, options = {
        enumerableOnly: true
    }, clonedObject = {}, seen = new WeakSet()) {
        if (seen.has(source) || arePrimitive(source)) {
            return source;
        }

        if (areArray(source)) {
            return cloneArray(source, options, seen);
        } else if (areSet(source)) {
            return cloneSet(source, options, seen);
        } else if (areMap(source)) {
            return cloneMap(source, options, seen);
        } else if (areDateObject(source)) {
            return cloneDateObject(source, options);
        } else if (areRegExp(source)) {
            return cloneRegExp(source, options);
        } else if (areValidObject(source)) {

            return cloneObject(source, options, clonedObject, seen);
        } else if (areValidFunction(source)) {
            return cloneFunction(source);
        } else if (areConstructor(source)) {
            return cloneConstructor(source, options, seen);
        } else if (areObject(source) && !areValidObject(source)) {
            return source.getInstance();
        }
        return clonedObject;
    }

    function cloneArray(array, options, seen = new WeakSet()) {
        const newArray = [];
        seen.add(array, newArray);

        for (let i = 0; i < array.length; i++) {
            newArray[i] = deepClone(array[i], options, {}, seen);
        }

        return newArray;
    }

    function cloneSet(set, options, seen = new WeakSet()) {
        const newSet = new Set();
        seen.add(set);

        set.forEach((value) => {
            newSet.add(deepClone(value, options, {}, seen));
        });

        return newSet;
    }

    function cloneMap(map, options, seen = new WeakSet()) {
        const newMap = new Map();
        seen.add(map);

        map.forEach((value, key) => {
            newMap.set(deepClone(key, options, {}, seen), deepClone(value, options, {}, seen));
        });

        return newMap;
    }

    function cloneDateObject(dateObj) {
        return new Date(dateObj.getTime());
    }

    function cloneRegExp(regExp) {
        const flags = regExp.flags;
        return new RegExp(regExp.source, flags);
    }

    function cloneObject(obj, options, clonedObject, seen = new WeakSet()) {
        seen.add(obj);

        const keys = ownKeys(obj, options);

        for (const key of keys) {
            if (clonedObject[key] !== obj[key]) {
                const descriptor = Object.getOwnPropertyDescriptor(obj, key);
                defineProperty(clonedObject, key, {
                    ...descriptor, 'value': deepClone(obj[key], options, {}, seen)
                });
            }
        }

        return clonedObject;
    }
    function cloneFunction(originalFunction) {
        return function (...args) {
            return originalFunction.apply(this, args);
        };
    }
    function cloneConstructor(originalConstructor, options, seen = new WeakSet()) {
        seen.add(originalConstructor);
        const clonedConstructor = function (...args) {
            originalConstructor.apply(this, args);
        };

        clonedConstructor.prototype = Object.create(originalConstructor.prototype);

        for (const key in originalConstructor) {
            if (originalConstructor.hasOwnProperty(key)) {
                if (areObject(originalConstructor[key])) {
                    clonedConstructor[key] = deepClone(originalConstructor[key], options, seen);
                } else {
                    clonedConstructor[key] = originalConstructor[key];
                }
            }
        }

        return clonedConstructor;
    }
    function every(callbackFn) {
        return Array.prototype.every.call(this, callbackFn);
    }
    function areString() {
        return every.bind(arguments)((arg)=>"string" === typeof arg);
    }
    function areSymbol() {
        return every.bind(arguments)((arg)=>"symbol" === typeof arg);
    }
    function areBool() {
        return every.bind(arguments)((arg)=>"boolean" === typeof arg);
    }
    function areNumber() {
        return every.bind(arguments)((arg)=>"number" === typeof arg&&!isNaN(arg));
    }
    function arePrimitive() {
        return every.bind(arguments)((arg)=>(areString(arg) || areNumber(arg) || areBool(arg) || areSymbol(arg)));
    }
    function areRegExp() {
        return every.bind(arguments)((arg)=>arg instanceof RegExp);
    }
    function areDateObject() {
        return every.bind(arguments)((arg)=>arg instanceof Date);
    }
    function areNull() {
        return every.bind(arguments)((arg)=>arg === null);
    }
    function areObject() {
        return every.bind(arguments)((arg)=>
            (!areArray(arg) && arg instanceof Object)
        );
    }
    function areSet() {
        return every.bind(arguments)((arg)=> arg instanceof Set);
    }
    function areMap() {
        return every.bind(arguments)((arg)=> arg instanceof Map);
    }
    function areValidObject() {
        return every.bind(arguments)((arg)=>areObject(arg)&&!areArray(arg)&&!/^\u0020*class\u0020+/.test(arg.constructor)&&!areSet(arg)&&!areMap(arg)&&!areRegExp(arg)&&!areHtmlElement(arg)&&!areDateObject(arg)&&!areValidFunction(arg));
    }
    function areValidFunction() {
        return Array.prototype.every.call(arguments,
            (arg)=>"function" === typeof arg&&!/^\u0020*class\u0020+/.test(arg.toString()));
    }
    function areArray() {
        return every.bind(arguments)((arg)=> Array.isArray(arg));
    }

    function areHtmlElement() {
        return every.bind(arguments)((arg)=>arg instanceof HTMLElement);
    }
    function areConstructor() {
        return Array.prototype.every.call(arguments, (arg)=> {
            if ("function" === typeof arg && "object" === typeof (arg.prototype??false)) {
                return (Object.getOwnPropertyNames(new arg()).length > 0);
            }
            return false;
        });
    }


    function defineProperty(object, key, predicate, options = {}) {
        const descriptor =
        (predicate instanceof Object) ? {
            configurable: predicate.configurable ?? true,
            enumerable: predicate.enumerable ?? true,
            writable: predicate.writable ?? true
        }: {
            configurable: true,
            enumerable: true,
            writable: true
        }

        const value = (predicate instanceof Object)?predicate.value: predicate;
        if (!descriptor.writable) {
            return false;
        }
        if (descriptor.configurable && !object.hasOwnProperty(key)) {
            if (options.static === true) {
                Reflect.defineProperty(object, key, {
                    ...descriptor, 'value': value
                });
                return true;
            }
            Object.defineProperty(object, key, {
                ...descriptor, 'value': value
            });
        }
        object[key] = value;
        return true;
    }

    function ownKeys(object, options) {
        const keys = [
            ...((options?.enumerableOnly
            )? Object.keys(object): Object.getOwnPropertyNames(object)),
            ...((options?.includeSymbols
            )? Object.getOwnPropertySymbols(object): []),
        ];
        return keys;
    }
    return Merger;
})