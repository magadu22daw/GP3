const express = require('express')
const path = require('path')
const { get } = require('request')
const mongoose = require('mongoose');
const uri = 'mongodb://localhost:27017'; // URI de conexión a la base de datos
const dbName = 'Login'; // Nombre de tu base de datos
const app = express()
const viewsDir = path.join(__dirname, 'views')

mongoose.connect('mongodb://localhost:27017/Login', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Conexión exitosa a MongoDB'))
  .catch(error => console.error('Error al conectar a MongoDB:', error));

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  descriptors: {
    type: [Array],
    required: true
  }
});

const User = mongoose.model('User', userSchema);

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, './public')))
app.use(express.static(path.join(__dirname, '../weights')))
app.use(express.static(path.join(__dirname, '../dist')))

app.get('/test', (req, res) => res.sendFile(path.join(viewsDir, 'webcamFaceDetection.html')))
app.get('/', (req, res) => res.sendFile(path.join(viewsDir, 'inici.html')))

app.get('/inici', (req, res) => res.sendFile(path.join(viewsDir, 'inici.html')))
app.get('/register', (req, res) => res.sendFile(path.join(viewsDir, 'register.html')))
app.get('/registerResumen', (req, res) => res.sendFile(path.join(viewsDir, 'registerResumen.html')))
app.get('/login', (req, res) => res.sendFile(path.join(viewsDir, 'login.html')))
app.get('/app', (req, res) => {res.sendFile(path.join(viewsDir, 'app.html'))})
app.get('/error', (req, res) => {res.sendFile(path.join(viewsDir, 'error.html'))})


app.post('/registerUser', async (req, res) => {
  try {    
    const { name, descriptors } = req.body; // Utilizar req.body en lugar de req.query
    console.log(name, descriptors);
    const newUser = new User({ name, descriptors });
    await newUser.save();
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

app.get('/getUser', async (req, res) => {
  try {
    const name = req.query.name;
    console.log(name)
    const user = await User.findOne({ name }); // Buscar usuario por nombre en la base de datos

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el usuario' });
  }
});

app.get('/getUserExist', async (req, res) => {
  try {
    const name = req.query.name;

    console.log(name)
    const user = await User.findOne({ name }); // Buscar usuario por nombre en la base de datos

    if (user) {
      res.json({ user: true });
    }
    else{
      res.json({ user: false });
    }    
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar el usuario' });
  }
});


app.get('/login', (req, res) => res.sendFile(path.join(viewsDir, 'login.html')))

app.listen(3000, () => console.log('Listening on port 3000!'))
