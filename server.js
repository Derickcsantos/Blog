const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const methodOverride = require('method-override');
const session = require('express-session');  // Para gerenciar sessões

const app = express();
const PORT = 3000;

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

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/meublog', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB conectado com sucesso!'))
    .catch(err => console.error('Erro ao conectar ao MongoDB:', err));

// Modelos
const Post = require('./models/post');

// Dados de usuários (definidos no código)
const users = [
    { email: 'derickcampossantos1@gmail.com', password: 'Basquete' },
    { email: 'silvadeoliveira.gustavo35@gmail.com', password: 'Gugutalkshow' },
    { email: 'reserva@gmail.com', password: '123' },
    { email: 'manutencao@suporte.com', password: '000' },
];

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(uploadsDir));
app.use(express.static('public')); // Para servir arquivos estáticos
app.use(methodOverride('_method')); // Para suportar o método DELETE via formulário
app.use(session({ secret: 'secret_key', resave: false, saveUninitialized: true })); // Sessões para login

// Configuração do EJS
app.set('view engine', 'ejs');

// Rota para a página inicial (agora na rota '/')
app.get('/', async (req, res) => {
    try {
        const posts = await Post.find(); // Carrega todos os posts do banco de dados
        res.render('index', { posts });   // Renderiza 'index.ejs' ao invés de 'blog.ejs'
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar os posts do blog');
    }
});

// Rota para a página administrativa (agora na rota '/admin')
app.get('/admin', async (req, res) => {
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

// Rota para a página de login
app.get('/login', (req, res) => {
    res.render('login'); // Exibe a página de login
});

// Rota para processar o login
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

// Rota para logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Erro ao sair');
        }
        res.redirect('/login');
    });
});

// Rota para criar post
app.post('/posts', upload.single('media'), async (req, res) => {
    const { title, content } = req.body;
    const media = req.file ? req.file.filename : null;

    if (!title || !content) {
        return res.status(400).json({ message: 'Título e conteúdo são obrigatórios!' });
    }

    // Verificando o tipo do arquivo de mídia
    if (req.file && !['image/jpeg', 'image/png'].includes(req.file.mimetype)) {
        return res.status(400).json({ message: 'Formato de arquivo inválido. Envie um arquivo JPEG ou PNG.' });
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

// Rota para excluir post
app.delete('/posts/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const post = await Post.findById(id); // Primeiro tenta encontrar o post
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }

        await Post.findByIdAndDelete(id); // Se o post for encontrado, deleta
        res.json({ message: 'Post deletado com sucesso!' });
    } catch (err) {
        console.error('Erro ao deletar o post:', err);
        res.status(500).json({ message: 'Erro ao deletar o post' });
    }
});

// Rota para adicionar like a um post
app.post('/posts/:id/like', async (req, res) => {
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

// Iniciar o servidor
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
