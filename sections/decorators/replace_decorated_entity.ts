const assert = require('node:assert/strict');

function replaceMethod() {
    return function () { // (A)
        return `How are you, ${this.name}?`;
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

const robin = new Person('Robin');
assert.equal(
    robin.hello(), 'How are you, Robin?'
);