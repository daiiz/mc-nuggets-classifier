// OpenCVを使う処理はここに書く
// tools/crop.py を移植

const mat = (...args) => new cv.Mat(...args)

// https://docs.opencv.org/3.4/db/d64/tutorial_js_colorspaces.html
// https://docs.opencv.org/3.4/d7/dd0/tutorial_js_thresholding.html
const convertToBin = async srcUrl => {
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

// 輪郭抽出
// https://docs.opencv.org/master/d0/d43/tutorial_js_table_of_contents_contours.html
const extractContour = async srcUrl => {
  const canvas = document.getElementById('out')
  const binImgSrcUrl = await convertToBin(srcUrl)
  const srcImg = await genImg(binImgSrcUrl)
  const srcImgWidth = srcImg.width
  console.log('width:', srcImgWidth)

  const imgBin = cv.imread(srcImg)
  cv.cvtColor(imgBin, imgBin, cv.COLOR_RGBA2GRAY)

  const contours = new cv.MatVector()
  const hierarchy = new cv.Mat()
  cv.findContours(imgBin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)

  // 面積が大きいものだけを残せばいい
  let areas = []
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i)
    const area = cv.contourArea(contour)
    areas.push(area)
  }
  areas = areas.sort().reverse()
  const largestArea = areas.shift()
  console.log('max area:', largestArea)

  let resContour = null
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i)
    const area = cv.contourArea(contour)
    if (area === largestArea) {
      resContour = contour
      break
    }
  }

  if (!resContour) {
    return { png: '', svg: '' }
  }

  // 輪郭を構成する点座標を取得する
  let points = []
  for (let i = 0; i < resContour.data32S.length; i += 2) {
    // https://stackoverflow.com/questions/59334122/how-can-i-get-coordinates-of-points-of-contour-corners-in-opencv-js
    // https://www.reddit.com/r/computervision/comments/8ko2if/questionopencvjs_get_xy_locations_from_a_contour/
    const point = [resContour.data32S[i], resContour.data32S[i + 1]]
    points.push(point)
  }
  // パスを閉じる
  points.push(points[0])

  // 1000x1000に正規化する。線の太さを統一するため。
  const scale = 1000 / srcImgWidth
  points = points.map(point => ([point[0] * scale, point[1] * scale]))
  const svgStr = createSvg([1000, ...points], srcImgWidth, '#fff')

  // 予測入力画像のサイズ (100x100) に縮小する
  const svgImg = await genImg(svgDataUrl(svgStr))
  canvas.width = 100
  canvas.height = 100
  const ctx = canvas.getContext('2d')
  ctx.drawImage(svgImg, 0, 0, 100, 100)

  return {
    dataUrl: {
      png: canvas.toDataURL(),
      svg: svgDataUrl(createSvg([1000, ...points], 300, 'greenyellow')) // cropperでのプレビュー用
    }
  }
}
