let acc: any;
function exposeAccess(_value, { access }) {
    acc = access;
}

class Color {
    @exposeAccess()
    name = "green";
}

const green = new Color();
assert.equal(green.name, "green");
// Using `acc` to get and set `green.name`
assert.equal(acc.get.call(green), "green");
acc.set.call(green, "red");
assert.equal(green.name, "red");