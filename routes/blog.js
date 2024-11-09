const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Post = require('../models/post');

// Configuração do Multer para upload de arquivos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Pasta onde os arquivos serão armazenados
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nome do arquivo
    }
});
const upload = multer({ storage: storage });

// Rota para criar post
router.post('/', upload.single('media'), async (req, res) => {
    const { title, content } = req.body;
    const media = req.file ? req.file.filename : null; // Nome do arquivo de mídia

    const newPost = new Post({
        title,
        content,
        media, // Salva o nome do arquivo de mídia
    });

    await newPost.save();
    res.json({ message: 'Post enviado com sucesso!' });
});

// Rota para buscar posts
router.get('/', async (req, res) => {
    const posts = await Post.find();
    res.json(posts); // Retorna todos os posts em JSON
});

module.exports = router;
