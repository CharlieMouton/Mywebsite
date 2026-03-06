;(function () {
  var count = 0
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.querySelector('.header-resume-btn')
    if (btn) {
      btn.addEventListener('animationiteration', function () {
        count++
        console.log('Cycle count:', count)
      })
    }
  })
})()
