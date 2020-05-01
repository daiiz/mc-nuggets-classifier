let model = null
const loadModel = async () => {
  console.time('[model] loading')
  model = await tf.automl.loadImageClassification('./models/rgb/model.json')
  console.timeEnd('[model] loading')
  console.log('[model]:', model)
}

const main = async () => {
  if (!model) await loadModel()
  const img = await cropCanvas()
  // previewImage(await convertToBin(img.src))
  const { png, svg } = await extractContour(img.src)
  previewImage(svg)

  // https://www.npmjs.com/package/@tensorflow/tfjs-automl#image-classification
  const predictions = await model.classify(img, { centerCrop: false })
  console.log(predictions)
  let max = predictions[0]
  for (const pred of predictions) {
    if (pred.prob > max.prob) max = pred
  }
  return max
}

let ctx = null
let canvas = null
let video = null
let cropper = null
let worker = null

const initCanvas = () => {
  canvas = document.getElementById('camera-canvas')
  ctx = canvas.getContext('2d')
}

const initCropper = () => {
  cropper = document.getElementById('crop')
  const label = document.getElementById('label')
  cropper.addEventListener('click', async e => {
    if (cropper.className) return
    cropper.className = 'running'
    label.style.display = 'none'
    const res = await main()
    cropper.className = ''
    label.innerText = `${res.label} ${Math.round(res.prob * 100) / 100}`
    label.style.display = 'block'
  })
}

let offset = 0
let videoWidth = 0
const renderCameraStream = () => {
  video = document.createElement('video')
  video.autoplay = true
  document.body.appendChild(video)

  const media = navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      width: Math.min(window.innerHeight, window.innerWidth),
      height: Math.min(window.innerHeight, window.innerWidth),
      facingMode: 'environment'
    }
  }).then(stream => {
    video.srcObject = stream
    const settings = stream.getVideoTracks()[0].getSettings()
    const { width, height } = settings
    videoWidth = Math.min(width, height)
    canvas.width = videoWidth
    canvas.height = videoWidth
    offset = (width - height) / 2
    updateCanvas()
  })
}

const updateCanvas = () => {
  if (!ctx || !video) return
  ctx.drawImage(video,
    0, offset,   videoWidth,   videoWidth,
    0,      0, canvas.width, canvas.width
  )
  window.requestAnimationFrame(updateCanvas)
}

const cropCanvas = () => {
  const { width, height } = canvas // 正方形
  const sourceImg = document.createElement('img')
  sourceImg.src = canvas.toDataURL()
  const out = document.createElement('canvas')
  const cropW = 300
  out.width = cropW
  out.height = cropW
  const cropX = (width - cropW) / 2
  const cropY = (height - cropW) / 2
  const outCtx = out.getContext('2d')
  return new Promise((resolve, reject) => {
    sourceImg.onload = () => {
      outCtx.drawImage(sourceImg, cropX, cropY, cropW, cropW, 0, 0, cropW, cropW)
      const outImg = document.createElement('img')
      outImg.src = out.toDataURL()
      outImg.onload = () => {
        resolve(outImg)
      }
    }
  })
}

window.addEventListener('load', async () => {
  // console.log(tf)
  initCanvas()
  initCropper()
  renderCameraStream()
  await loadModel()
  // await convertToBin('./images/samples/a.jpg')
  // const { png, svg } = await extractContour('./images/samples/a.jpg')
  // previewImage(svg)
})
