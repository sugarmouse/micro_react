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

function render(element, container) {
  const dom = element.type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(element.type)

  const isProperty = key => key !== "children"

  Object.keys(element.props)
    .filter(isProperty)
    .forEach(attributeKey => {
      dom[attributeKey] = element.props[attributeKey]
    })

  element.props.children.forEach(childNode => {
    render(childNode, dom)
  })


  container.appendChild(dom)
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