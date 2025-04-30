const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');

// Get all blog posts
exports.getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .sort({ publishDate: -1 })
      .select('-__v')
      .populate('createdBy', 'username');
    
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single blog post by ID
exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id)
      .select('-__v')
      .populate('createdBy', 'username');
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    // Increment view count
    blog.views += 1;
    await blog.save();
    
    res.json(blog);
  } catch (err) {
    console.error('Error fetching blog:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a new blog post
exports.createBlog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, excerpt, tags, imageUrl } = req.body;
    
    const newBlog = new Blog({
      title,
      content,
      excerpt,
      author: req.user.username || 'Admin',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      imageUrl,
      createdBy: req.user.id
    });
    
    const blog = await newBlog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error('Error creating blog:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update a blog post
exports.updateBlog = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, content, excerpt, tags, imageUrl, isPublished } = req.body;
    
    // Build blog object
    const blogFields = {};
    if (title) blogFields.title = title;
    if (content) blogFields.content = content;
    if (excerpt) blogFields.excerpt = excerpt;
    if (tags) blogFields.tags = tags.split(',').map(tag => tag.trim());
    if (imageUrl) blogFields.imageUrl = imageUrl;
    if (isPublished !== undefined) blogFields.isPublished = isPublished;
    blogFields.updatedAt = Date.now();
    
    let blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check user
    if (blog.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    blog = await Blog.findByIdAndUpdate(
      req.params.id,
      { $set: blogFields },
      { new: true }
    );
    
    res.json(blog);
  } catch (err) {
    console.error('Error updating blog:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete a blog post
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    // Check user
    if (blog.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    await Blog.findByIdAndRemove(req.params.id);
    
    res.json({ message: 'Blog post removed' });
  } catch (err) {
    console.error('Error deleting blog:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Blog post not found' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
};

// Get blog posts by tag
exports.getBlogsByTag = async (req, res) => {
  try {
    const blogs = await Blog.find({ 
      tags: req.params.tag,
      isPublished: true 
    })
      .sort({ publishDate: -1 })
      .select('-__v')
      .populate('createdBy', 'username');
    
    res.json(blogs);
  } catch (err) {
    console.error('Error fetching blogs by tag:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
