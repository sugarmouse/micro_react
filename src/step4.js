/**
 * write our version of the ReactDOM.render function.
 */

const microReact = {
  createElement,
  render
}

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === "object" ? child : createTextElement(child))
    }
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

/**
 * It creates a DOM node based on the type of the element
 * @param fiber - The current fiber that we're working on.
 * @returns A DOM node
 */
function createDom(fiber) {
  const dom = fiber.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(fiber.type)

  const isProperty = key => key !== "children"

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(attributeKey => {
      dom[attributeKey] = fiber.props[attributeKey]
    })

  return dom
}

function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

let nextUnitOfWork = null

/**
 * "If there's work to be done, do it. If there's no work to be done, wait for the browser to tell us
 * when there is."
 * 
 * The browser will call the workLoop function whenever it has a spare moment
 * @param deadline - An object with a timeRemaining() method that returns the number of milliseconds
 * remaining in the current frame.
 */
function workLoop(deadline) {
  let shouldYield = false
  while (nextUnitOfWork && !shouldYield) {
    //performUnitOfWork function: performs the work and  returns the next unit of work.
    nextUnitOfWork = performUnitOfWork(
      nextUnitOfWork
    )
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}

requestIdleCallback(workLoop)

function performUnitOfWork(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  const elements = fiber.props.children
  let index = 0
  let preSibling = null

  // And we add it to the fiber tree setting it either as a child or as a sibling, 
  // depending on whether it’s the first child or not.
  while (index < elements.length) {
    const element = elements[index]

    const newFiber = {
      type: element.type,
      props: element.props,
      parent: fiber,
      dom: null,
    }

    if (index === 0) {
      fiber.child = newFiber
    } else {
      preSibling.sibling = newFiber
    }

    preSibling = newFiber
    index++
  }

  // Finally we search for the next unit of work. 
  // We first try with the child, then with the sibling, then with the uncle, and so on.
  if (fiber.child) {
    return fiber.child
  }

  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }

}

//tell babel to transpile the JSX use the function we define
/**@jsx microReact.createElement */
const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)


const container = document.getElementById("root")
microReact.render(element, container)