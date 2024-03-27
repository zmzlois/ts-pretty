import assert from "node:assert/strict"

function replaceMethod<T>(): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => void {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor): void { // (A)
        const originalFn = (target as Record<string, unknown>)[propertyKey] as () => void;
        descriptor.value = function (this: T, ...args: unknown[]): void {

            console.log("hello");
            originalFn.apply<T, unknown[], unknown>(this, args);



        };
        // return `How are you, ${this.name}?`;
    }
}

class Person {
    name: string;
    constructor(name: string) {
        this.name = name;
    }


    @replaceMethod()
    hello() { // (B)
        return `Hi ${this.name}!`;
    }
}

export const robin = new Person('Robin');
assert.equal(
    robin.hello(), 'How are you, Robin?'
);