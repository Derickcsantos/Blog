const express = require('express');
const router = express.Router();

// Rota para a página inicial
router.get('/', (req, res) => {
    res.send('<h1>Bem-vindo ao meu blog!</h1><p>Use /posts para criar ou visualizar posts.</p>');
});

module.exports = router;
