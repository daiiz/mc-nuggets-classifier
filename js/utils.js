const previewImage = srcUrl => {
  const cropper = document.getElementById('crop')
  cropper.style.backgroundImage = `url(${srcUrl})`
  // 3sで消す
  window.setTimeout(() => {
    cropper.style.backgroundImage = ''
  }, 3000)
}
