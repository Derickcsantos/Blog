const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Rota para exibir o formulário de login
router.get('/login', (req, res) => {
  res.render('login'); // Renderiza a view login.ejs
});

// Rota POST para processar o login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });

  if (user && user.comparePassword(password)) {
    req.session.user = user;
    res.redirect('/blog');
  } else {
    res.redirect('/login');
  }
});

// Middleware para proteger rotas
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.redirect('/login');
}

module.exports = { router, isAuthenticated };
