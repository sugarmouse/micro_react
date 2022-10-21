/**
 * DOM 的更新和删除
 * 
 * 上一步存在的问题：
 *  只能实现往 DOM 里添加元素，但是没有处理 更新 和 删除 节点的逻辑
 * 
 * 处理：
 *
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
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // 一个链接到旧的 fiber，即我们在前一个提交阶段提交到 DOM 的 fiber。
    alternate: currentRoot,
  }

  nextUnitOfWork = wipRoot
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

  // 当所有的 fiber tree 都处理完成之后再一次性的 append 所有的 HTML DOM
  if (!nextUnitOfWork && wipRoot) {
    commitRoot()
  }
  requestIdleCallback(workLoop)
}

/**
 * CommitRoot() is called when the work loop is done processing the current root fiber. 
 * 
 * It commits the work done on the current root fiber and then sets the current root fiber to the
 * previous root fiber. 
 * 
 * This is important because it allows us to keep track of the previous root fiber so that we can use
 * it to compare against the next root fiber. 
 * 
 * This is how we know when the tree has changed
 */
function commitRoot() {
  commitWork(wipRoot.child)
  // currentRoot 变量用来记录上一次提交的 root fiber 
  currentRoot = wipRoot
  // 全部 append 完成之后销毁 wipRoot
  wipRoot = null
}

/**
 * fiber tree 创建的所有对应节点 append 到对应的父节点
 * @param fiber - the current fiber
 * @returns the dom element.
 */
function commitWork(fiber) {
  if (!fiber) {
    return
  }
  const domParent = fiber.parent.dom
  domParent.appendChild(fiber.dom)
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}


/**
 * fiber tree 的处理函数，虚拟 DOM tree 创建 HTML DOM
 * @param fiber - 当前需要处理的 fiber 节点
 * @returns 下一个需要处理的 fiber 节点
 */
function performUnitOfWork(fiber) {
  // 创建当前 fiber 对应的 HTML DOM
  if (!fiber.dom) {
    fiber.dom = createDom(fiber)
  }

  // *delete from step 4* 删除单个节点的 append 流程

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
   * 设置下一个需要处理的 fiber 节点
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

let nextUnitOfWork = null
let currentRoot = null
let wipRoot = null
requestIdleCallback(workLoop)



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