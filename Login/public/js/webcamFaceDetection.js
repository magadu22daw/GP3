let forwardTimes = [];

function updateTimeStats(timeInMs) {
  forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30);
  const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length;
  $('#time').val(`${Math.round(avgTimeInMs)} ms`);
  $('#fps').val(`${faceapi.utils.round(1000 / avgTimeInMs)}`);
}

async function onPlay() {
  const videoEl = $('#inputVideo').get(0);

  if (videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
    return setTimeout(() => onPlay());

  const options = getFaceDetectorOptions();
  const ts = Date.now();
  const result = await faceapi.detectSingleFace(videoEl, options);
  updateTimeStats(Date.now() - ts);

  if (result) {
    const canvas = $('#overlay').get(0);
    const dims = faceapi.matchDimensions(canvas, videoEl, true);
    faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));

    // Comparar con la foto
    const photo = document.getElementById('photo');
    const photoResult = await faceapi.detectSingleFace(photo, options);

    if (photoResult) {
      await faceapi.loadFaceRecognitionModel(); // Cargar modelo de reconocimiento facial
      const maxDescriptorDistance = 0.5;
      const videoDescriptor = await faceapi.computeFaceDescriptor(videoEl);
      const photoDescriptor = await faceapi.computeFaceDescriptor(photo);
      console.log(photoDescriptor)

      if (videoDescriptor && photoDescriptor) {
        const faceMatcher = new faceapi.FaceMatcher([photoDescriptor], maxDescriptorDistance);
        const bestMatch = faceMatcher.findBestMatch(videoDescriptor);

        console.log(`Se parece a la foto: ${bestMatch.label}`);
        
      } else {
        console.log('No se pudo calcular el descriptor facial del video o la foto.');
      }
    } else {
      console.log('No se pudo detectar una cara en la foto.');
    }
  } else {
    console.log('No se pudo detectar una cara en el video.');
  }

  setTimeout(() => onPlay());
}

async function run() {
  // Cargar modelo de detección de rostros
  await changeFaceDetector(TINY_FACE_DETECTOR);
  changeInputSize(128);

  // Cargar modelos adicionales
  await faceapi.loadFaceLandmarkModel();
  await faceapi.loadFaceRecognitionModel();

  // Intentar acceder a la cámara web del usuario y transmitir las imágenes
  // al elemento de video
  const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
  const videoEl = $('#inputVideo').get(0);
  videoEl.srcObject = stream;
}

function updateResults() {}

window.onload = function() {
  initFaceDetectionControls();
  run();
};