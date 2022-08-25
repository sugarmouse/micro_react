
export const microReact = {
  createElement,
  render
}

/**
 * It takes a type, props, and children, and returns an object with a type and props
 * @param type - The type of element, either a string like "div" or "span", or a function for a
 * component.
 * @param props - {
 * @param children - An array of child elements.
 * @returns An object with a type and props.
 */
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => typeof child === "object" ? child : createTextElement(child)),
    },
  }
}

/**
 * It takes a string and returns an object that represents a text element
 * @param text - The text to be rendered
 * @returns An object with two properties: type and props.
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
 * If the element is a text element, create a text node, otherwise create an element, then for each
 * attribute, set the attribute on the dom, then for each child, render the child, then append the dom
 * to the container.
 * @param element - The element to render
 * @param container - The DOM element that we want to render our element into.
 */
function render(element, container) {
  const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode(" ") : document.createElement(element.type)
  const isProperty = key => key !== "children"
  Object.keys(element.props).filter(isProperty).forEach(attribute => {
    dom[attribute] = element.props[attribute]
  })
  element.props.children.forEach(child => {
    render(child, dom)
  })
  container.appendChild(dom)
}