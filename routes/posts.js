const express = require('express');
const router = express.Router();
const Post = require('../models/post');

// Create a post
router.post('/add', async (req, res) => {
  const { title, description, content, media } = req.body;
  const newPost = new Post({ title, description, content, media });
  await newPost.save();
  res.redirect('/blog');
});

// Edit post
router.post('/edit/:id', async (req, res) => {
  const { title, description, content, media } = req.body;
  await Post.findByIdAndUpdate(req.params.id, { title, description, content, media });
  res.redirect('/blog');
});

// Delete post
router.post('/delete/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.redirect('/blog');
});

// Like post
router.post('/like/:id', async (req, res) => {
  const post = await Post.findById(req.params.id);
  post.likes += 1;
  await post.save();
  res.redirect('/blog');
});

module.exports = router;
