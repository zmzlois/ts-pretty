# metaprogramming thing

How a decorator looks like

```typescript
type DecoratedValue = "usuallySomeClassOrMethodInClassGetsDecorated";
type ReplacementValue = "replaceValue";
type Decorator = (
  value: DecoratedValue, // only fields differ
  context: {
    kind: string;
    name: string | symbol;
    addInitializer(initializer: () => void): void;

    // Don’t always exist:
    static: boolean;
    private: boolean;
    access: { get: () => unknown; set: (value: unknown) => void };
  }
) => void | ReplacementValue; // only fields differ
```

Exact type of Decorators

```typescript
type DecoratorType =
  | ClassDecorator
  | ClassMethodDecorator
  | ClassGetterDecorator
  | ClassSetterDecorator
  | ClassAutoAccessorDecorator
  | ClassFieldDecorator;
```

### What can decorators do ?

- Change the decorated entity by changing the parameter value
- Replace the decorated entity by returning a compatible value

  - "Compatible" -> return value must have the same type as the decorated value - ex: class decorators must return callable values (ok what's callable values, like a function?)
  - If the decorator doesn't want to replace the decorated value it can return undefined

- Exposing access to the decorated entity to others (enabled by `context.access` via `get()` and `set()`)
- Process decorated entity and its container after both exists
  - `context.addInitializer`. let's the decorator register an initializer - a callback that is invoked when everything is ready.

### Replacing decorated entity

```typescript
function replaceMethod() {
  return function () {
    // (A)
    return `How are you, ${this.name}?`;
  };
}

class Person {
  constructor(name) {
    this.name = name;
  }
  @replaceMethod
  hello() {
    // (B)
    return `Hi ${this.name}!`;
  }
}

const robin = new Person("Robin");
assert.equal(robin.hello(), "How are you, Robin?");
```

### Exposing access to the decorated entity to others

The decorator @exposeAccess stores an object in the variable acc that lets us access property `.green` of the instances of Color.

```typescript
let acc;
function exposeAccess(_value, { access }) {
  acc = access;
}

class Color {
  @exposeAccess
  name = "green";
}

const green = new Color();
assert.equal(green.name, "green");
// Using `acc` to get and set `green.name`
assert.equal(acc.get.call(green), "green");
acc.set.call(green, "red");
assert.equal(green.name, "red");
```

### Processing the decorated entity and its container

Use the decorator `@collect` to store the keys of decorated methods in the instance property .collectedMethodKeys:

```typescript
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
  toString() {}
  @collect
  [Symbol.iterator]() {}
}
const inst = new C();
assert.deepEqual(
  inst.collectedMethodKeys,
  new Set(["toString", Symbol.iterator])
);
```

## Summary tables

#### Type of decorators

| Kind of Decorators | (input) => output             | `.access`    |
| ------------------ | ----------------------------- | ------------ |
| **Class**          | (func) => func2               | -            |
| **Method**         | (func) => func2               | `{get}`      |
| **Getter**         | (func) => func2               | `{get}`      |
| **Setter**         | (func) => func2               | `{set}`      |
| **Auto-accessor**  | ({get,set}) => {get,set,init} | `{get, set}` |
| **Field**          | () => (initValue)=>initValue2 | `{get, set}` |

#### Value of `this` in functions:

| `this` is ->                      | undefined | Class | Instance |
| --------------------------------- | --------- | ----- | -------- |
| Decorator function                | ✔        |       |          |
| Static initialiser                |           | ✔    |          |
| Non-static initialiser            |           |       | ✔       |
| Static Field decorator result     |           | ✔    |          |
| Non-static field decorator result |           |       | ✔       |

## Syntax and semantics of decorators

Can use any expression if we put it in parentheses:

```typescript
@(«expr»)

// Five decorators for MyClass

@myFunc
@myFuncFactory('arg1', 'arg2')

@libraryModule.prop
@someObj.method(123)

@(wrap(dict['prop'])) // arbitrary expression

class MyClass {}
```

### How are decorators executed

- **Evaluation**: Evaluated during the execution of the class definition, along with computed property keys and static fields. The result must be functions. The are stored in a temporary location to be invoked later.
- **Invocation**: The decorator functions are called later during the execution of a class definition after methods have been evaluated but before constructors and prototypes have been assembled. The results are stored in temporary locations.
- **Application**: After all decorator functions are invoked, their results are used, which can affect constructors and prototypes. Class decorators are applied after all methods and field decorators.

```typescript
function decorate(str) {
  console.log(`EVALUATE @decorate(): ${str}`);
  return () => console.log(`APPLY @decorate(): ${str}`); // (A)
}
function log(str) {
  console.log(str);
  return str;
}

@decorate("class")
class TheClass {
  @decorate("static field")
  static staticField = log("static field value");

  @decorate("prototype method")
  [log("computed key")]() {}

  @decorate("instance field")
  instanceField = log("instance field value");
  // This initializer only runs if we instantiate the class
}

// Output:
// EVALUATE @decorate(): class
// EVALUATE @decorate(): static field
// EVALUATE @decorate(): prototype method
// computed key
// EVALUATE @decorate(): instance field
// APPLY @decorate(): prototype method
// APPLY @decorate(): static field
// APPLY @decorate(): instance field
// APPLY @decorate(): class
// static field value
```

tldr: actual content are executed before its decorated value ran. returns are excuted after all the class methods are executed.

### When do decorator initialisers run?

When a decorator initiliser runs, depends on the kind of decorator:

- Class decorator initilisers run after the class if fully defined and all static fields were initialised.
- The initialiser of non-static class element ran during instantiation, before instance fields are initialised.
- The initialiser of static class element decorators run during class definition, before static fields are defined but after all other class elements were defined.

```typescript
// We wait until after instantiation before we log steps,
// so that we can compare the value of `this` with the instance.
const steps = [];
function push(msg, _this) {
  steps.push({ msg, _this });
}
function pushStr(str) {
  steps.push(str);
}

function init(_value, { name, addInitializer }) {
  pushStr(`@init ${name}`);
  if (addInitializer) {
    addInitializer(function () {
      push(`DECORATOR INITIALIZER ${name}`, this);
    });
  }
}

@init
class TheClass {
  //--- Static ---

  static {
    pushStr("static block");
  }

  @init static staticMethod() {}
  @init static accessor staticAcc = pushStr("staticAcc");
  @init static staticField = pushStr("staticField");

  //--- Non-static ---

  @init prototypeMethod() {}
  @init accessor instanceAcc = pushStr("instanceAcc");
  @init instanceField = pushStr("instanceField");

  constructor() {
    pushStr("constructor");
  }
}

pushStr("===== Instantiation =====");
const inst = new TheClass();

for (const step of steps) {
  if (typeof step === "string") {
    console.log(step);
    continue;
  }
  let thisDesc = "???";
  if (step._this === TheClass) {
    thisDesc = TheClass.name;
  } else if (step._this === inst) {
    thisDesc = "inst";
  } else if (step._this === undefined) {
    thisDesc = "undefined";
  }
  console.log(`${step.msg} (this===${thisDesc})`);
}

// Output:
// @init staticMethod
// @init staticAcc
// @init prototypeMethod
// @init instanceAcc
// @init staticField
// @init instanceField
// @init TheClass
// DECORATOR INITIALIZER staticMethod (this===TheClass)
// DECORATOR INITIALIZER staticAcc (this===TheClass)
// static block
// staticAcc
// staticField
// DECORATOR INITIALIZER TheClass (this===TheClass)
// ===== Instantiation =====
// DECORATOR INITIALIZER prototypeMethod (this===inst)
// DECORATOR INITIALIZER instanceAcc (this===inst)
// instanceAcc
// instanceField
// constructor
```

## Technique for exposing data from decorators

Use decorators to collect data

### Storing exposed data in a surrounding scope

Note that this won't work if decorators come from another module.

```typescript
// the decorator @collect collects classes and stores them in the Set classes (line A):

const classes = new Set(); // (A)

function collect(value, { kind, addInitializer }) {
  if (kind === "class") {
    classes.add(value);
  }
}

@collect
class A {}
@collect
class B {}
@collect
class C {}

assert.deepEqual(classes, new Set([A, B, C]));
```

### Managing exposed data via a factory function

A more sophisticated approach is to use a factory function createClassCollector() that returns:

- A class decorator `collect`
- A Set `classes`, to which the decorator will add the classes it collects

```typescript
function createClassCollector() {
  const classes = new Set();
  function collect(value, { kind, addInitializer }) {
    if (kind === "class") {
      classes.add(value);
    }
  }
  return {
    classes,
    collect,
  };
}

const { classes, collect } = createClassCollector();

@collect
class A {}
@collect
class B {}
@collect
class C {}

assert.deepEqual(classes, new Set([A, B, C]));
```

### Managing exposed data via a class

Instead of a factory function:

- `.classes`, a Set with the collected classes
- `.install`, a class decorator

```typescript
class ClassCollector {
  classes = new Set();
  install = (value, { kind }) => {
    // (A)
    if (kind === "class") {
      this.classes.add(value); // (B)
    }
  };
}

const collector = new ClassCollector();

@collector.install
class A {}
@collector.install
class B {}
@collector.install
class C {}

assert.deepEqual(collector.classes, new Set([A, B, C]));
```
