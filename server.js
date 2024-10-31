const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/meublog', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB conectado com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Modelos
const Post = require('./models/post');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('uploads'));
app.use(express.static('public')); // Para servir arquivos estáticos

// Configuração do EJS
app.set('view engine', 'ejs');

// Rota para a página inicial (administrativa)
app.get('/', async (req, res) => {
    try {
        const posts = await Post.find(); // Carrega todos os posts do banco de dados
        res.render('index', { posts });  // Passa os posts para a página inicial
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar os posts');
    }
});

// Rota para a página do blog
app.get('/blog', async (req, res) => {
    try {
        const posts = await Post.find(); // Carrega todos os posts do banco de dados
        res.render('blog', { posts });   // Passa os posts para a página do blog
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar os posts do blog');
    }
});

// Rota para criar post
app.post('/posts', upload.single('media'), async (req, res) => {
    const { title, description, content } = req.body;
    const media = req.file ? req.file.filename : null;

    try {
        const newPost = new Post({
            title,
            description,
            content,
            media,
        });

        await newPost.save();
        res.json({ message: 'Post enviado com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar o post:', err);
        res.status(500).json({ message: 'Erro ao enviar o post' });
    }
});

// Rota para excluir post
app.delete('/posts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const post = await Post.findByIdAndDelete(id); // Encontra e deleta o post pelo ID
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }
        res.json({ message: 'Post deletado com sucesso!' });
    } catch (err) {
        console.error('Erro ao deletar o post:', err);
        res.status(500).json({ message: 'Erro ao deletar o post' });
    }
});

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
