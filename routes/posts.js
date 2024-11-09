const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// Criar um post
router.post('/add', async (req, res) => {
  const { title, content, media } = req.body;

  // Cria o novo post com os dados recebidos
  const newPost = new Post({
    title, 
    content, 
    media // media pode ser opcional
  });

  // Salva o post no banco de dados
  await newPost.save();
  res.redirect('/blog'); // redireciona para a página do blog
});

// Editar post
router.post('/edit/:id', async (req, res) => {
  const { title, content, media } = req.body;

  // Atualiza o post existente com o id fornecido
  await Post.findByIdAndUpdate(req.params.id, { title, content, media });

  res.redirect('/blog'); // redireciona para a página do blog
});

// Excluir post
router.post('/delete/:id', async (req, res) => {
  // Exclui o post pelo id fornecido
  await Post.findByIdAndDelete(req.params.id);
  res.redirect('/blog'); // redireciona para a página do blog
});

// Curtir post
router.post('/like/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.likes += 1; // aumenta o contador de likes
  await post.save();
  res.redirect('/blog'); // redireciona para a página do blog
});


module.exports = router;
