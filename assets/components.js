/**
 * Client-side component loader for portfolio pages.
 * Finds elements with data-component="<name>" and injects HTML from components/<name>.html.
 * Supports data-* attributes as props for components that need them.
 */
;(function () {
  function getBasePath() {
    const script = document.currentScript
    if (script?.src) {
      const path = new URL(script.src).pathname
      return path.replace(/\/[^/]*$/, '').replace(/\/[^/]*$/, '') + '/'
    }
    return ''
  }

  function loadComponent(el) {
    const name = el.getAttribute('data-component')
    if (!name) return

    const slotContent = el.innerHTML.trim()
    const dataContent = el.getAttribute('data-content') || ''
    const base = getBasePath()
    const url = base + 'components/' + name + '.html'

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load ' + url)
        return res.text()
      })
      .then(function (html) {
        el.innerHTML = html
        var content = slotContent || dataContent
        var slot = el.querySelector('[data-slot="content"]')
        if (slot && content) slot.innerHTML = content
        applyProps(el)
      })
      .catch(function (err) {
        console.warn('[components.js]', err.message)
      })
  }

  function applyProps(container) {
    const props = {}
    for (const attr of container.attributes) {
      if (attr.name.startsWith('data-') && attr.name !== 'data-component') {
        const key = attr.name.slice(5).replace(/-([a-z])/g, function (_, c) {
          return c.toUpperCase()
        })
        props[key] = attr.value
      }
    }

    if (Object.keys(props).length === 0) return

    for (const placeholder of container.querySelectorAll('[data-prop]')) {
      const propName = placeholder.getAttribute('data-prop')
      const value = props[propName]
      if (value !== undefined) {
        if (placeholder.tagName === 'IMG') {
          if (propName === 'src' || propName === 'icon') {
            var imgSrc = value
            if (
              imgSrc.indexOf('/') !== 0 &&
              !imgSrc.startsWith('http') &&
              !imgSrc.startsWith('assets/')
            ) {
              imgSrc = 'assets/img/' + value
            }
            placeholder.src = imgSrc
            if (props.alt !== undefined) placeholder.alt = props.alt
          } else if (propName === 'alt') {
            placeholder.alt = value
          }
        } else if (placeholder.hasAttribute('data-html')) {
          placeholder.innerHTML = value
        } else {
          placeholder.textContent = value
        }
      }
    }

    if (props.svg) {
      const svgContainer = container.querySelector('[data-svg-slot]')
      if (svgContainer) {
        const img = document.createElement('img')
        img.src = 'assets/img/' + props.svg
        img.alt = ''
        img.setAttribute('aria-hidden', 'true')
        svgContainer.appendChild(img)
      }
    }
  }

  function init() {
    document.querySelectorAll('[data-component]').forEach(loadComponent)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
