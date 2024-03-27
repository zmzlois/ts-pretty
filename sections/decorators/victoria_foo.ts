function sayHello<T>(): (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => void {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalFn = (target as Record<string, unknown>)[propertyKey] as () => void;
        descriptor.value = function (this: T, ...args: unknown[]): void {
            console.log("hello");
            originalFn.apply<T, unknown[], unknown>(this, args);
            console.log("world");
        };
    };
}

class Foo {
    @sayHello()
    public sayFoo(): void {
        console.log("foo");
    }
}

const a = new Foo();

a.sayFoo();