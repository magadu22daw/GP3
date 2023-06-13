
let forwardTimes = [];
let isPlaying = false;
let isRegistrationComplete = false;
const progressBar = document.getElementById('progressBar');

async function startVideoAndPlay() {
  const videoEl = document.getElementById('inputVideo');
  let newUsername = document.getElementById('username').value;
  let exist;
  var requestOptions = {
    method: 'GET',
    redirect: 'follow'
  };

  try {
    const response = await fetch("http://localhost:3000/getUserExist?name=" + newUsername, requestOptions);
    const result = await response.json();
    exist = result.user;
    if (exist == true) {
      console.log(result.user);
      document.getElementById("error").innerText = "User already exist";
    }
    console.log(!isPlaying && exist);

    if (!isPlaying && !exist) {
      
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
    await faceapi.loadFaceRecognitionModel(); // Cargar modelo de reconocimiento facial
    const videoDescriptor = await faceapi.computeFaceDescriptor(videoEl);
    let username = document.getElementById("username").value;

    if (videoDescriptor) {
      // Guardar el descriptor en un arreglo
      if (!videoEl.descriptors) {
        videoEl.descriptors = [];
      }
      videoEl.descriptors.push(Array.from(videoDescriptor));

      // Actualizar la barra de progreso
      const progress = (videoEl.descriptors.length / 10) * 100;
      const progressBar = document.getElementById('progress');
      progressBar.style.width = `${progress}%`;

      if (videoEl.descriptors.length >= 10) {
        registerUser(username, videoEl.descriptors);
        console.log(videoEl.descriptors);
        videoEl.descriptors = []; // Reiniciar el arreglo de descriptores

        // Reiniciar la barra de progreso
        progressBar.style.width = '0%';
        window.location.replace("http://localhost:3000/registerResumen");
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
async function registerUser(name, descriptors) {
  try {
    const payload = {
      name: name,
      descriptors: descriptors
    };

    const response = await fetch('http://localhost:3000/registerUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log(data);

    // Reinicia la barra de progreso después de registrar al usuario
    const progressElement = document.getElementById('progressBar');
    progressElement.style.width = '0%';
  } catch (error) {
    console.error(error);
  }
}


window.onload = function () {

  initFaceDetectionControls();
  run();
};
