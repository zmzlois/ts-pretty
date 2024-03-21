
// this won't work, pay attention to context
function loggedMethod(originalMethod: any, _context: any) {

  function replacementMethod(this: any, ...args: any[]) {
    console.log("LOGS: Entering method...")
    const result = originalMethod.call(this, ...args)
    console.log("LOG: Exiting method")
    return result;
  }

  return replacementMethod
}


function workingLoggedMethod(originalMethod: any, context: ClassMethodDecoratorContext) {

  const methodName = String(context.name)

  function replacementMethod(this: any, ...args: any[]) {
    console.log(`Log: Entering method ${methodName}`)

    const result = originalMethod.call(this, ...args);

    console.log(`Log: Exiting method ${methodName}`)

    return result
  }

  return replacementMethod
}

function customisedLoggedMethod(headMessage = "LOG:") {
  return function actualDecorator(originalMethod: any, context: ClassMethodDecoratorContext) {
    const methodName = String(context.name)


    function replacementMethod(this: any, ...args: any[]) {
      console.log(`${headMessage} Entering method ${methodName}...`)

      const result = originalMethod.call(this, ...args);

      console.log(`${headMessage} Exiting method ${methodName}...`)

      return result
    }
    return replacementMethod
  }
}

function wellTypedDecorators<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name)

  function replacementMethod(this: This, ...args: Args): Return {
    console.log(`LOG: Entering method ${methodName}`)
    const result = target.call(this, ...args)
    console.log(`LOG: Exiting method ${methodName}`)

    return result
  }
  return replacementMethod
}

function bound(originalMethod: any, context: ClassMethodDecoratorContext) {
  const methodName = String(context.name)

  if (context.private) {
    throw new Error(`"bound" can not decorate private properties like ${methodName}`)
  }

  context.addInitializer(function() { // It’s a way to hook into the beginning of the constructor (or the initialization of the class itself if we’re working with statics).
    this[methodName] = this[methodName].bind(this)
  })
}

export class OldPerson {
  name: string
  constructor(name: string) {
    this.name = name
    this.greet = this.greet.bind(this) // commond in old javascript
  }

  greet() {
    console.log(`hiii old person ${name}`)
  }


}


export class NewPerson {
  name: string
  constructor(name: string) {
    this.name = name
  }

  //@loggedMethod
  @bound  // bind(this) can be replaced with this
  //  @workingLoggedMethod
  @customisedLoggedMethod("LOG THIS THIS:")
  greet() { // use arrow function to decalre it as a property initialised
    console.log(`Hiiii ${this.name}`)
  }
}





