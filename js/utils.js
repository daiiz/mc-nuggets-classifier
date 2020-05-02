const previewImage = srcUrl => {
  const cropper = document.getElementById('crop')
  cropper.style.backgroundImage = `url(${srcUrl})`
  window.setTimeout(() => {
    cropper.style.backgroundImage = ''
  }, 4000)
}

const createSvg = (points, size=1000, lineColor='#000', bgColor='transparent') => {
  const width = points.shift()
  const lStr = points.map(point => point.join(',')).join(' ')
  const dStr = `M${points[0]} L${lStr}`
  const svgPathStr = `<path fill="transparent" stroke="${lineColor}" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" d="${dStr}"></path>`
  const rectStr = `<rect x="0" y="0" width="${width}" height="${width}" fill="${bgColor}"></rect>`
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${width} ${width}">${rectStr}${svgPathStr}</svg>`
}

const svgDataUrl = svgStr => {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgStr)}`
}

const genImg = srcUrl => {
  const elem = document.createElement('img')
  return new Promise((resolve, reject) => {
    elem.src = srcUrl
    elem.onload = () => resolve(elem)
    elem.onerror = () => reject(elem)
  })
}

const showLabel = text => {
  const label = document.getElementById('label')
  label.innerText = text
  label.style.display = 'block'
}

const hideLabel = () => {
  const label = document.getElementById('label')
  label.style.display = 'none'
}
