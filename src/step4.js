/**
 * 创建 fiber tree 结构，并且分步渲染
 */

 const microReact = {
  createElement,
  render
}

/**
 * JSX 转换成虚拟 DOM
 * @param type - 节点类型，HTML tag 或者 ”TEXT ELEMENT“
 * @param props - HTML Tag 的属性
 * @param children - 子节点
 * @returns 虚拟 DOM tree
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === "object" ? child : createTextElement(child))
    }
  }
}

/**
 * 创建一个虚拟的文本 DOM 节点
 * @param text - 需要渲染的文本信息
 * @returns 一个虚拟的 DOM 文本节点
 */
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
 * 单个虚拟DOM节点转换成真实的HTML DOM，并且绑定对应属性
 * @param fiber - 当前正生成的虚拟 DOM 节点
 * @returns 一个真实的 HTML DOM
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



/**
 * 定义初始的 fiber 节点，也就是根节点
 * @param element - JSX Element
 * @param container - 整个 app 的根节点
 */
function render(element, container) {
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  }
}

/**
 * 等浏览器空闲时
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

let nextUnitOfWork = null
requestIdleCallback(workLoop)

/**
 * fiber tree 的处理函数，虚拟 DOM tree 创建 HTML DOM
 * @param fiber - 当前需要处理的 fiber 节点
 * @returns 下一个需要处理的 fiber 节点
 */
function performUnitOfWork(fiber) {
  // 创建当前 fiber 对应的 HTML DOM，并且 append 到其对应的 parent fiber
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom)
  }

  // 子节点处理
  // 将子节点数组的第一个元素设置成 fiber 的 child， 其余的设置成上一个子节点的 sibling
  const elements = fiber.props.children
  let index = 0
  let preSibling = null

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

  /**
   * 设置下一个工作节点
   * 
   * 1. 如果有 child fiber 则优先处理 child fiber
   * 2. 如果没有 child， 则优先处理 sibling fiber
   * 3. 如果没有 child 和 sibling， 则处理 parent 的 sibling fiber
  */
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