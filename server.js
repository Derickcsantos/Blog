const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const methodOverride = require('method-override');
const session = require('express-session'); // Para gerenciar sessões
require('dotenv').config();

// Configuração do Express
const app = express();

// Configuração do MongoDB
let isConnected = false; // Verifica se a conexão já está ativa

async function connectToDatabase() {
    if (isConnected) {
        console.log('Usando conexão existente com MongoDB.');
        return;
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log('MongoDB conectado com sucesso!');
    } catch (err) {
        console.error('Erro ao conectar ao MongoDB:', err);
        throw err;
    }
}

// Verifica se a pasta 'uploads' existe, se não, cria
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(express.static(uploadsDir));
app.use(express.static('public')); // Para servir arquivos estáticos
app.use(methodOverride('_method')); // Para suportar o método DELETE via formulário
app.use(session({ secret: 'secret_key', resave: false, saveUninitialized: true })); // Sessões para login

// Configuração do EJS
app.set('view engine', 'ejs');

// Modelos
const Post = require('./models/post');

// Dados de usuários (definidos no código)
const users = [
    { email: 'derickcampossantos1@gmail.com', password: 'Basquete-1' },
    { email: 'silvadeoliveira.gustavo35@gmail.com', password: 'Gugutalkshow' },
    { email: 'reserva@gmail.com', password: '123' },
    { email: 'manutencao@suporte.com', password: '000' },
];

// Rotas

// Página inicial
app.get('/', async (req, res) => {
    await connectToDatabase();
    try {
        const posts = await Post.find(); // Carrega todos os posts
        res.render('index', { posts }); // Renderiza o arquivo `index.ejs` e passa os posts
    } catch (err) {
        console.error('Erro ao carregar os posts do blog:', err);
        res.status(500).send('Erro ao carregar os posts do blog');
    }
});

// Página administrativa
app.get('/admin', async (req, res) => {
    await connectToDatabase();

    if (!req.session.user) { // Se não estiver logado
        return res.redirect('/login'); // Redireciona para o login
    }

    try {
        const posts = await Post.find(); // Carrega todos os posts do banco de dados
        res.render('admin', { posts });  // Passa os posts para a página administrativa (admin.ejs)
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar os posts');
    }
});

// Página de login
app.get('/login', (req, res) => {
    res.render('login'); // Exibe a página de login
});

// Processa o login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        req.session.user = user; // Salva o usuário na sessão
        return res.redirect('/admin'); // Redireciona para a página administrativa após login
    } else {
        return res.status(401).send('Credenciais inválidas'); // Caso as credenciais sejam inválidas
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erro ao sair');
        }
        res.redirect('/login');
    });
});

// Criação de post
app.post('/posts', upload.single('media'), async (req, res) => {
    await connectToDatabase();

    const { title, content } = req.body;
    const media = req.file ? req.file.filename : null;

    if (!title || !content) {
        return res.status(400).json({ message: 'Título e conteúdo são obrigatórios!' });
    }

    try {
        const newPost = new Post({
            title,
            content,
            media,
            likes: 0,
        });

        await newPost.save();
        res.json({ message: 'Post enviado com sucesso!' });
    } catch (err) {
        console.error('Erro ao salvar o post:', err);
        res.status(500).json({ message: 'Erro ao enviar o post' });
    }
});

// Exclusão de post
app.delete('/posts/:id', async (req, res) => {
    await connectToDatabase();

    const { id } = req.params;

    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }

        await Post.findByIdAndDelete(id);
        res.json({ message: 'Post deletado com sucesso!' });
    } catch (err) {
        console.error('Erro ao deletar o post:', err);
        res.status(500).json({ message: 'Erro ao deletar o post' });
    }
});

// Adicionar like a um post
app.post('/posts/:id/like', async (req, res) => {
    await connectToDatabase();

    const { id } = req.params;

    try {
        const post = await Post.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });

        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }

        res.json({ message: 'Like adicionado com sucesso!', likes: post.likes });
    } catch (err) {
        console.error('Erro ao adicionar like: ', err);
        res.status(500).json({ message: 'Erro ao adicionar like' });
    }
});

// Exporta o app para Vercel
module.exports = app;
