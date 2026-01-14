const express = require('express');
const jwt = require('jsonwebtoken');
const Board = require('../models/Board');
const router = express.Router();

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get task types for a board
router.get('/board/:boardId', authenticate, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.boardId,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(board.taskTypes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task types' });
  }
});

// Add new task type
router.post('/board/:boardId', authenticate, async (req, res) => {
  try {
    const { name, color, icon, description } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Task type name is required' });
    }

    const board = await Board.findOne({
      _id: req.params.boardId,
      'members.user': req.userId,
      'members.role': 'admin'
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied or not admin' });
    }

    // Check if task type already exists
    const existingType = board.taskTypes.find(t => t.name === name.trim());
    if (existingType) {
      return res.status(400).json({ error: 'Task type already exists' });
    }

    const newType = {
      name: name.trim(),
      color: color || '#6B7280',
      icon: icon || '📝',
      description: description || '',
      order: board.taskTypes.length,
      isActive: true
    };

    board.taskTypes.push(newType);
    await board.save();

    res.status(201).json(newType);
  } catch (error) {
    console.error('Add task type error:', error);
    res.status(500).json({ error: 'Failed to add task type' });
  }
});

// Update task type
router.put('/board/:boardId/:typeId', authenticate, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.boardId,
      'members.user': req.userId,
      'members.role': 'admin'
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied or not admin' });
    }

    const typeIndex = board.taskTypes.findIndex(t => t._id.toString() === req.params.typeId);
    if (typeIndex === -1) {
      return res.status(404).json({ error: 'Task type not found' });
    }

    Object.assign(board.taskTypes[typeIndex], req.body);
    await board.save();

    res.json(board.taskTypes[typeIndex]);
  } catch (error) {
    console.error('Update task type error:', error);
    res.status(500).json({ error: 'Failed to update task type' });
  }
});

// Delete task type
router.delete('/board/:boardId/:typeId', authenticate, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.boardId,
      'members.user': req.userId,
      'members.role': 'admin'
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied or not admin' });
    }

    const typeIndex = board.taskTypes.findIndex(t => t._id.toString() === req.params.typeId);
    if (typeIndex === -1) {
      return res.status(404).json({ error: 'Task type not found' });
    }

    // Mark as inactive instead of deleting
    board.taskTypes[typeIndex].isActive = false;
    await board.save();

    res.json({ message: 'Task type deactivated' });
  } catch (error) {
    console.error('Delete task type error:', error);
    res.status(500).json({ error: 'Failed to delete task type' });
  }
});

module.exports = router;