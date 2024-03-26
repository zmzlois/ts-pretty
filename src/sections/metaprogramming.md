# metaprogramming thing

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

## Syntax and semantics of decorators

Can use any expression if we put it in parentheses:

```typescript
@(«expr»)
```
