/**
 * Client-side component loader for portfolio pages.
 * Finds elements with data-component="<name>" and injects HTML from components/<name>.html.
 * Supports data-* attributes as props for components that need them.
 */
;(function () {
  function captureEvent(name, props) {
    if (typeof posthog !== 'undefined') posthog.capture(name, props || {})
  }

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
        if (name === 'hero') {
          var cycleAttr = el.getAttribute('data-icon-cycle')
          if (cycleAttr) initHeroIconCycle(el, cycleAttr, el.getAttribute('data-icon-cycle-speed'))
          initHeroDividerCycle(el, el.getAttribute('data-divider-cycle-speed'))
        }
        if (name === 'image') initImageEnhance(el)
        if (name === 'header') {
          initHeaderLinks(el)
          initHeaderDropdown(el)
          initMobileMenu(el)
          initHeaderActiveState(el)
        }
        if (name === 'footer') {
          initFooterContact(el)
        }
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
            if (props.alt !== undefined) {
              placeholder.alt = props.alt
              placeholder.setAttribute('aria-label', props.alt)
            }
          } else if (propName === 'alt') {
            placeholder.alt = value
            placeholder.setAttribute('aria-label', value)
          }
        } else if (placeholder.tagName === 'SOURCE' && propName === 'srcMobile' && value) {
          var mobileSrc = value
          if (
            mobileSrc.indexOf('/') !== 0 &&
            !mobileSrc.startsWith('http') &&
            !mobileSrc.startsWith('assets/')
          ) {
            mobileSrc = 'assets/img/' + value
          }
          placeholder.srcset = mobileSrc
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

  function initHeroIconCycle(container, cycleAttr, speedAttr) {
    var icons = cycleAttr.split(',').map(function (s) { return s.trim() })
    if (icons.length === 0) return
    var img = container.querySelector('.hero-image img')
    if (!img) return
    var speedMs = getCycleSpeed(speedAttr, '--icon-cycle-speed')
    var index = 0
    setInterval(function () {
      index = (index + 1) % icons.length
      var src = icons[index]
      if (src.indexOf('/') !== 0 && !src.startsWith('http') && !src.startsWith('assets/')) {
        src = 'assets/img/' + src
      }
      img.src = src
    }, speedMs)
  }

  function getCycleSpeed(speedAttr, cssVar) {
    if (speedAttr != null && speedAttr !== '') {
      var parsed = parseInt(speedAttr, 10)
      if (!isNaN(parsed) && parsed > 0) return parsed
    }
    var cssSpeed = getComputedStyle(document.documentElement).getPropertyValue(cssVar)
    if (cssSpeed) {
      var parsedCss = parseInt(String(cssSpeed).trim(), 10)
      if (!isNaN(parsedCss) && parsedCss > 0) return parsedCss
    }
    return 500
  }

  var DEFAULT_DIVIDER_CYCLE = 'decorative/divider1.svg,decorative/divider2.svg,decorative/divider3.svg'

  function initHeroDividerCycle(container, speedAttr) {
    var icons = DEFAULT_DIVIDER_CYCLE.split(',').map(function (s) { return s.trim() })
    if (icons.length === 0) return
    var img = container.querySelector('.hero-divider img')
    if (!img) return
    var speedMs = getCycleSpeed(speedAttr, '--icon-cycle-speed')
    var index = 0
    var src = icons[0]
    if (src.indexOf('/') !== 0 && !src.startsWith('http') && !src.startsWith('assets/')) {
      src = 'assets/img/' + src
    }
    img.src = src
    setInterval(function () {
      index = (index + 1) % icons.length
      src = icons[index]
      if (src.indexOf('/') !== 0 && !src.startsWith('http') && !src.startsWith('assets/')) {
        src = 'assets/img/' + src
      }
      img.src = src
    }, speedMs)
  }

  function initImageEnhance(container) {
    var img = container.querySelector('.content-image img')
    if (!img || !img.src) return

    if (window.innerWidth <= 768) return

    img.addEventListener('click', function (e) {
      e.preventDefault()
      var previousFocus = document.activeElement
      var rect = img.getBoundingClientRect()

      var overlay = document.createElement('div')
      overlay.className = 'image-enhance-overlay'
      overlay.setAttribute('role', 'dialog')
      overlay.setAttribute('aria-modal', 'true')
      overlay.setAttribute('aria-label', img.alt || 'Enlarged image view')

      var enhanceImg = document.createElement('img')
      enhanceImg.src = img.src
      enhanceImg.alt = img.alt || ''
      enhanceImg.draggable = false
      enhanceImg.style.top = rect.top + 'px'
      enhanceImg.style.left = rect.left + 'px'
      enhanceImg.style.width = rect.width + 'px'
      enhanceImg.style.height = rect.height + 'px'
      overlay.appendChild(enhanceImg)

      var finalTop, finalLeft, finalW, finalH
      var baseScale = 1
      var zoomScale = 1
      var panX = 0
      var panY = 0
      var isZoomed = false
      var lastX = 0
      var lastY = 0
      var lastTime = 0

      function close() {
        overlay.classList.remove('is-open')
        enhanceImg.classList.remove('is-expanded', 'is-zoomed')
        enhanceImg.style.top = rect.top + 'px'
        enhanceImg.style.left = rect.left + 'px'
        enhanceImg.style.width = rect.width + 'px'
        enhanceImg.style.height = rect.height + 'px'
        enhanceImg.style.transform = ''
        setTimeout(function () {
          overlay.remove()
          document.body.style.overflow = ''
          document.body.style.paddingRight = ''
          overlay.removeEventListener('click', onOverlayClick)
          enhanceImg.removeEventListener('click', onImageClick)
          document.removeEventListener('keydown', onKey)
          document.removeEventListener('mousemove', onMouseMove)
          if (previousFocus && previousFocus.focus) previousFocus.focus()
        }, 400)
      }

      function runExpand() {
        var vw = window.innerWidth
        var vh = window.innerHeight
        var padding = 40
        var maxW = vw - padding
        var maxH = vh - padding
        var nw = enhanceImg.naturalWidth || rect.width
        var nh = enhanceImg.naturalHeight || rect.height
        baseScale = Math.min(maxW / nw, maxH / nh, 1)
        zoomScale = Math.min(1.4, 1 / baseScale)
        finalW = nw * baseScale
        finalH = nh * baseScale
        finalTop = (vh - finalH) / 2
        finalLeft = (vw - finalW) / 2

        overlay.classList.add('is-open')
        enhanceImg.classList.add('is-expanded')
        enhanceImg.style.top = finalTop + 'px'
        enhanceImg.style.left = finalLeft + 'px'
        enhanceImg.style.width = finalW + 'px'
        enhanceImg.style.height = finalH + 'px'
        isZoomed = true
        enhanceImg.classList.add('is-zoomed')
        panX = 0
        panY = 0
        lastTime = 0
        enhanceImg.style.transform = 'scale(' + zoomScale + ')'
        captureEvent('image_expanded')
      }

      function onOverlayClick(e) {
        if (e.target === overlay) close()
      }

      function onImageClick(e) {
        e.stopPropagation()
        close()
      }

      function onMouseMove(e) {
        if (!isZoomed) return
        var now = performance.now()
        if (lastTime === 0) {
          lastX = e.clientX
          lastY = e.clientY
          lastTime = now
          return
        }
        var dt = (now - lastTime) / 16.67
        if (dt < 0.5) dt = 0.5
        var velocityX = (e.clientX - lastX) / dt
        var velocityY = (e.clientY - lastY) / dt
        lastX = e.clientX
        lastY = e.clientY
        lastTime = now
        panX -= velocityX * 2
        panY -= velocityY * 2
        var vw = window.innerWidth
        var vh = window.innerHeight
        var zoomedW = finalW * zoomScale
        var zoomedH = finalH * zoomScale
        var scaleOffset = (zoomScale - 1) * 0.5
        var leftBound = finalW * scaleOffset - finalLeft
        var rightBound = vw - finalLeft - finalW - finalW * scaleOffset
        var topBound = finalH * scaleOffset - finalTop
        var bottomBound = vh - finalTop - finalH - finalH * scaleOffset
        var panXMin = Math.min(leftBound, rightBound)
        var panXMax = Math.max(leftBound, rightBound)
        var panYMin = Math.min(topBound, bottomBound)
        var panYMax = Math.max(topBound, bottomBound)
        panX = Math.max(panXMin, Math.min(panXMax, panX))
        panY = Math.max(panYMin, Math.min(panYMax, panY))
        enhanceImg.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoomScale + ')'
      }

      overlay.addEventListener('click', onOverlayClick)
      enhanceImg.addEventListener('click', onImageClick)
      document.addEventListener('mousemove', onMouseMove)
      var onKey = function (e) {
        if (e.key === 'Escape') close()
      }
      document.addEventListener('keydown', onKey)

      var scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = scrollbarWidth + 'px'
      }
      document.body.style.overflow = 'hidden'
      document.body.appendChild(overlay)

      if (enhanceImg.complete && enhanceImg.naturalWidth) {
        requestAnimationFrame(function () { requestAnimationFrame(runExpand) })
      } else {
        enhanceImg.onload = function () {
          requestAnimationFrame(function () { requestAnimationFrame(runExpand) })
        }
      }
    })
  }

  function initHeaderActiveState(container) {
    var path = window.location.pathname
    container.querySelectorAll('.header-link').forEach(function (link) {
      var href = link.getAttribute('href')
      // Match /lead and /lead/ — exclude root to avoid false positives
      if (href && href !== '/' && path.startsWith(href)) {
        link.classList.add('is-active')
      }
    })
  }

  function initHeaderLinks(container) {
    container.querySelectorAll('.header-link:not(.header-dropdown-trigger)').forEach(function (link) {
      link.addEventListener('mouseenter', function () {
        link.classList.add('has-hovered')
      }, { once: true })
    })
  }

  function initHeaderDropdown(container) {
    var trigger = container.querySelector('.header-dropdown-trigger')
    var menu = container.querySelector('.header-dropdown-menu')
    var dropdown = container.querySelector('.header-dropdown')
    if (!trigger || !menu || !dropdown) return

    function open() {
      trigger.setAttribute('aria-expanded', 'true')
    }
    function close() {
      trigger.setAttribute('aria-expanded', 'false')
    }

    trigger.addEventListener('click', function (e) {
      e.preventDefault()
      if (trigger.getAttribute('aria-expanded') === 'true') {
        close()
      } else {
        open()
      }
    })

    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (trigger.getAttribute('aria-expanded') === 'true') {
          close()
        } else {
          open()
        }
      } else if (e.key === 'Escape') {
        close()
        trigger.focus()
      }
    })

    document.addEventListener('click', function (e) {
      if (!dropdown.contains(e.target)) close()
    })
  }

  function initMobileMenu(container) {
    var hamburger = container.querySelector('.header-hamburger')
    var overlay = container.querySelector('.header-mobile-overlay')
    var closeBtn = container.querySelector('.header-mobile-close')
    var mobileLinks = container.querySelectorAll('.header-mobile-link')

    if (!hamburger || !overlay) return

    function openMenu() {
      overlay.classList.add('is-open')
      hamburger.setAttribute('aria-expanded', 'true')
      overlay.setAttribute('aria-hidden', 'false')
      document.body.style.overflow = 'hidden'
      captureEvent('mobile_menu_opened')
    }

    function closeMenu() {
      overlay.classList.remove('is-open')
      hamburger.setAttribute('aria-expanded', 'false')
      overlay.setAttribute('aria-hidden', 'true')
      document.body.style.overflow = ''
    }

    hamburger.addEventListener('click', function () {
      if (overlay.classList.contains('is-open')) {
        closeMenu()
      } else {
        openMenu()
      }
    })

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu)
    }

    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu)
    })
  }

  function initFooterContact(container) {
    var link = container.querySelector('.footer-contact-link')
    if (!link) return

    link.addEventListener('mouseenter', function () {
      link.classList.add('has-hovered')
    }, { once: true })

    link.addEventListener('click', function (e) {
      e.preventDefault()
      captureEvent('get_in_touch_clicked')
      var parent = link.parentNode
      var wrapper = document.createElement('div')
      wrapper.className = 'footer-contact-reveal'

      var email = 'charlie@moutons.org'
      var emailBtn = document.createElement('button')
      emailBtn.className = 'footer-contact-email'
      emailBtn.textContent = email
      emailBtn.addEventListener('mouseenter', function () {
        emailBtn.classList.add('has-hovered')
      }, { once: true })
      emailBtn.addEventListener('click', function () {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            captureEvent('email_copied')
            emailBtn.textContent = 'Copied!'
            setTimeout(function () { emailBtn.textContent = email }, 1000)
          }).catch(function () { window.location.href = 'mailto:' + email })
        } else {
          window.location.href = 'mailto:' + email
        }
      })

      var linkedInLink = document.createElement('a')
      linkedInLink.className = 'footer-contact-link'
      linkedInLink.href = 'https://www.linkedin.com/in/charliemouton/'
      linkedInLink.target = '_blank'
      linkedInLink.rel = 'noopener noreferrer'
      linkedInLink.textContent = 'LinkedIn'
      linkedInLink.addEventListener('mouseenter', function () {
        linkedInLink.classList.add('has-hovered')
      }, { once: true })
      linkedInLink.addEventListener('click', function () {
        captureEvent('linkedin_clicked')
      })

      var gitHubLink = document.createElement('a')
      gitHubLink.className = 'footer-contact-link'
      gitHubLink.href = 'https://github.com/CharlieMouton'
      gitHubLink.target = '_blank'
      gitHubLink.rel = 'noopener noreferrer'
      gitHubLink.textContent = 'GitHub'
      gitHubLink.addEventListener('mouseenter', function () {
        gitHubLink.classList.add('has-hovered')
      }, { once: true })
      gitHubLink.addEventListener('click', function () {
        captureEvent('github_clicked')
      })

      wrapper.appendChild(emailBtn)
      wrapper.appendChild(linkedInLink)
      wrapper.appendChild(gitHubLink)
      parent.replaceChild(wrapper, link)
    })
  }

  function init() {
    document.querySelectorAll('[data-component]').forEach(loadComponent)
    var hero = document.querySelector('.hero')
    if (hero) initHeroDividerCycle(hero, null)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
