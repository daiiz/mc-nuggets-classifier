// OpenCVを使う処理はここに書く
// tools/crop.py を移植

const genImg = srcUrl => {
  const elem = document.createElement('img')
  return new Promise((resolve, reject) => {
    elem.src = srcUrl
    elem.onload = () => {
      resolve(elem)
    }
    elem.onerror = () => {
      reject(elem)
    }
  })
}

const mat = (...args) => new cv.Mat(...args)

// https://docs.opencv.org/3.4/db/d64/tutorial_js_colorspaces.html
// https://docs.opencv.org/3.4/d7/dd0/tutorial_js_thresholding.html
const convertToBin = async (srcUrl) => {
  const canvas = document.getElementById('out')
  const src = cv.imread(await genImg(srcUrl))
  const hsv = mat()
  cv.cvtColor(src, hsv, cv.COLOR_RGB2HSV)
  // 抽出する色空間を定義
  // https://answers.opencv.org/question/222770/hsv-white-color-range-in-js/ ?
  // https://gist.github.com/pocka/0446c8a8a9e1699ca3c65a0801f99222 ?
  // https://docs.opencv.org/master/db/d64/tutorial_js_colorspaces.html
  const lower = cv.matFromArray(3, 1, cv.CV_64F, [10, 100, 20])
  const upper = cv.matFromArray(3, 1, cv.CV_64F, [20, 255, 200])
  // const lower = mat(src.rows, src.cols, src.type(), [51, 8, 0, 0])
  // const upper = mat(src.rows, src.cols, src.type(), [255, 84, 0, 255])
  // const lower = mat(hsv.rows, hsv.cols, hsv.type(), [10, 100, 20, 255])
  // const upper = mat(hsv.rows, hsv.cols, hsv.type(), [20, 255, 200, 255])
  const mask = mat()
  cv.inRange(hsv, lower, upper, mask)
  cv.imshow('out', mask)
  const src2 = cv.imread(await genImg(canvas.toDataURL()))

  const maskedImg = mat()
  cv.bitwise_and(src, src2, maskedImg)
  cv.imshow('out', maskedImg)
  const src3 = cv.imread(await genImg(canvas.toDataURL()))

  const grayImg = mat()
  // グレースケール化（maskedImgよりもナチュラルな輪郭や凹凸が得られるため）
  cv.cvtColor(src3, grayImg, cv.COLOR_BGR2GRAY)
  // 大津の二値化
  const binImg = mat()
  cv.threshold(grayImg, binImg, 0, 255, cv.THRESH_OTSU)
  cv.imshow('out', binImg)

  return canvas.toDataURL()
}
