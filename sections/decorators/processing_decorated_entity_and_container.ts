function collect(_value, { name, addInitializer }) {
    addInitializer(function () {
        // (A)
        if (!this.collectedMethodKeys) {
            this.collectedMethodKeys = new Set();
        }
        this.collectedMethodKeys.add(name);
    });
}

class C {
    @collect
    toString() { }
    @collect
    [Symbol.iterator]() { }
}
const inst = new C();
assert.deepEqual(
    inst.collectedMethodKeys,
    new Set(["toString", Symbol.iterator])
);