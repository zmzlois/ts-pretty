class ClassCollector {
    classes = new Set();
    install = (value, { kind }) => { // (A)
        if (kind === 'class') {
            this.classes.add(value); // (B)
        }
    };
}

const collector = new ClassCollector();

@collector.install
class A { }
@collector.install
class B { }
@collector.install
class C { }

assert.deepEqual(
    collector.classes, new Set([A, B, C])
);