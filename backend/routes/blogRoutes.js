// Blog routes
const express = require('express');
const router = express.Router();
const BlogController = require('../controllers/BlogController');
const auth = require('../middleware/auth');

// Get all blogs
router.get('/', BlogController.getAllBlogs);

// Get blog by ID
router.get('/:id', BlogController.getBlogById);

// Create a new blog (protected route)
router.post('/', auth, BlogController.createBlog);

// Update a blog (protected route)
router.put('/:id', auth, BlogController.updateBlog);

// Delete a blog (protected route)
router.delete('/:id', auth, BlogController.deleteBlog);

// Get blogs by tag
router.get('/tag/:tag', BlogController.getBlogsByTag);

module.exports = router;
