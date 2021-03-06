
const modelNames = [
  'rgb',
  'bin',
  'contour'
]

let model = null
const loadModel = async modelName => {
  if (!modelName || !modelNames.includes(modelName)) {
    return showLabel('Invalid modelName')
  }
  showLabel('Loading...')
  console.time('[model] loading')
  model = null
  try {
    model = await tf.automl.loadImageClassification(`./automl-models/${modelName}/model.json`)
    model.modelName = modelName
    hideLabel()
  } catch (err) {
    console.error(err)
    showLabel(`Failed to load: ${modelName}`)
  } finally {
    console.timeEnd('[model] loading')
  }
  console.log('[model]:', modelName, model)
}

const getMostLikelyItem = predictions => {
  console.log(predictions)
  let max = predictions[0]
  for (const pred of predictions) {
    if (pred.prob > max.prob) max = pred
  }
  return max
}

const predict = async (inputImg) => {
  if (!model) return showLabel('The model is not ready.')

  // モデルにあわせて入力画像を加工
  switch (model.modelName) {
    case 'rgb': {
      previewImage(inputImg.src)
      break
    }
    case 'bin': {
      const dataUrl = await convertToBin(inputImg.src)
      inputImg = await genImg(dataUrl)
      previewImage(dataUrl)
      break
    }
    case 'contour': {
      const { dataUrl } = await extractContour(inputImg.src)
      inputImg = await genImg(dataUrl.png)
      previewImage(dataUrl.svg)
      break
    }
  }
  // https://www.npmjs.com/package/@tensorflow/tfjs-automl#image-classification
  const predictions = await model.classify(inputImg, { centerCrop: false })
  return getMostLikelyItem(predictions)
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
  cropper.addEventListener('click', async e => {
    if (e.target.id.startsWith('model-selector')) return
    if (cropper.className) return
    cropper.className = 'running'
    hideLabel()
    const res = await predict(await cropCanvas())
    cropper.className = ''
    showLabel(`${res.label} ${Math.round(res.prob * 100) / 100}`)
  }, false)
}

const initModelSelector = () => {
  const selector = document.getElementById('model-selector')
  selector.addEventListener('change', async e => {
    await loadModel(e.target.value)
  }, false)
  const randomImageButton = document.getElementById('model-selector-rand-image')
  randomImageButton?.addEventListener('click', async e => {
    await predictRandomImage()
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
  initCanvas()
  initCropper()
  renderCameraStream()
  await loadModel(modelNames[0])
  initModelSelector()
})

const predictRandomImage = async () => {
  const arr = [
    './images/samples/s0.jpg',
    './images/samples/s1.jpg',
    './images/samples/s2.jpg',
    './images/samples/s3.jpg',
  ]
  const idx = Math.floor(Math.random() * arr.length)
  const res = await predict(await genImg(arr[idx]))
  showLabel(`${res.label} ${Math.round(res.prob * 100) / 100}`)
}
