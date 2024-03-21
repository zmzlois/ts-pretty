
# metaprogramming thing

```typescript
type DecoratedValue = "usuallySomeClassOrMethodInClassGetsDecorated"
type ReplacementValue = "replaceValue"
type Decorator = (
  value: DecoratedValue, // only fields differ
  context: {
    kind: string;
    name: string | symbol;
    addInitializer(initializer: () => void): void;

    // Don’t always exist:
    static: boolean;
    private: boolean;
    access: { get: () => unknown, set: (value: unknown) => void };
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
  | ClassFieldDecorator
  ;
```

Replacing decorated entity

```typescript

function replaceMethod() {
  return function () { // (A)
    return `How are you, ${this.name}?`;
  }
}

class Person {
  constructor(name) {
    this.name = name;
  }
  @replaceMethod
  hello() { // (B)
    return `Hi ${this.name}!`;
  }
}

const robin = new Person('Robin');
assert.equal(
  robin.hello(), 'How are you, Robin?'
);

```


exposing access to the decorated entity to others 


```typescript 
let acc;
function exposeAccess(_value, {access}) {
  acc = access;
}

class Color {
  @exposeAccess
  name = 'green'
}

const green = new Color();
assert.equal(
  green.name, 'green'
);
// Using `acc` to get and set `green.name`
assert.equal(
  acc.get.call(green), 'green'
);
acc.set.call(green, 'red');
assert.equal(
  green.name, 'red'
);

```

processing the decorated entity and its container 

```typescript
function collect(_value, {name, addInitializer}) {
  addInitializer(function () { // (A)
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
  new Set(['toString', Symbol.iterator])
);
```


## Syntax and semantics of decorators

Can use any expression if we put it in parentheses:
```typescript 
@(«expr»)
```


