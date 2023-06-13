let forwardTimes = [];
let username;
let isPlaying = false;

function updateTimeStats(timeInMs) {
  forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30);
  const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length;
  $('#time').val(`${Math.round(avgTimeInMs)} ms`);
  $('#fps').val(`${faceapi.utils.round(1000 / avgTimeInMs)}`);
}
async function startVideoAndPlay() {
  const videoEl = document.getElementById('inputVideo');
  let newUsername = document.getElementById('username').value;
  username = newUsername
  let exist;
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  try {
    const response = await fetch("http://localhost:3000/getUserExist?name=" + newUsername, requestOptions);
    const result = await response.json();
    exist = result.user;
    if (exist == false) {
      console.log(result.user);
      document.getElementById("error").innerText = "User not found";
    }
    console.log(!isPlaying && exist);

    if (!isPlaying && exist) {

      document.getElementById("error").innerText = " ";
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoEl.srcObject = stream;
        isPlaying = true;
        onPlay(); // Llamar a onPlay() después de que se haya iniciado el video correctamente
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    }
  } catch (error) {
    console.log('error', error);
  }
}


async function onPlay() {
  let userDescriptors;
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  fetch("http://localhost:3000/getUser?name=" + username, requestOptions)
    .then(response => response.json())
    .then(result => {
      const descriptors = result.descriptors.map(descriptor => new Float32Array(descriptor));
      userDescriptors = descriptors;
    })
    .catch(error => console.log('error', error));

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

    await faceapi.loadFaceRecognitionModel(); // Cargar modelo de reconocimiento facial
    const maxDescriptorDistance = 0.26;
    const videoDescriptor = await faceapi.computeFaceDescriptor(videoEl);

    if (videoDescriptor) {
      const faceMatcher = new faceapi.FaceMatcher(userDescriptors, maxDescriptorDistance);
      const bestMatch = faceMatcher.findBestMatch(videoDescriptor);

      if (bestMatch.distance <= maxDescriptorDistance) {
        window.location.replace("http://localhost:3000/app");
        
      } else {
        // El usuario no está autenticado
        console.log(bestMatch.distance);
        console.log('Inicio de sesión fallido');
      }

    } else {
      console.log('No se pudo calcular el descriptor facial del video o la foto.');
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

function updateResults() { }

window.onload = function () {
  initFaceDetectionControls();
  run();
};