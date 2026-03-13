;(function () {
  function inject() {
    var xhr = new XMLHttpRequest()
    var link = document.querySelector('link[href*="styles.css"]')
    var base = (link && link.href ? link.href : '').replace(/[^/]+$/, '')
    xhr.open('GET', base + 'img/buttonBorderFilters.svg')
    xhr.onload = function () {
      if (xhr.status === 200) {
        var parser = new DOMParser()
        var doc = parser.parseFromString(xhr.responseText, 'image/svg+xml')
        var defs = doc.querySelector('defs')
        if (defs) {
          var svg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'svg'
          )
          svg.style.cssText = 'position:absolute;width:0;height:0;'
          svg.appendChild(defs.cloneNode(true))
          document.body.insertBefore(svg, document.body.firstChild)
        }
      }
    }
    xhr.send()
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject)
  } else {
    inject()
  }
})()
