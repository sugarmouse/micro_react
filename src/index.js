import { microReact }  from "./createElement"

 /** @jsx microReact.createElement */
 const element = (
  <div id="foo">
    <a>bar</a>
    <b />
  </div>
)

const container = document.getElementById('root')
microReact.render(element, container)