const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
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

// Get user progress stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    // Get all boards where user is a member
    const boards = await Board.find({ 'members.user': req.userId });
    const boardIds = boards.map(board => board._id);

    // Get all tasks from these boards
    const tasks = await Task.find({ board: { $in: boardIds } });

    // Calculate stats
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.column === 'done').length,
      inProgressTasks: tasks.filter(t => t.column === 'inprogress').length,
      pendingTasks: tasks.filter(t => t.column === 'todo').length,
      byType: {
        DSA: tasks.filter(t => t.type === 'DSA').length,
        HR: tasks.filter(t => t.type === 'HR').length,
        SystemDesign: tasks.filter(t => t.type === 'System Design').length
      },
      byDifficulty: {
        Easy: tasks.filter(t => t.difficulty === 'Easy').length,
        Medium: tasks.filter(t => t.difficulty === 'Medium').length,
        Hard: tasks.filter(t => t.difficulty === 'Hard').length
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    res.status(500).json({ error: 'Failed to fetch progress stats' });
  }
});

// Get all tasks for user (for dashboard)
router.get('/all-tasks', authenticate, async (req, res) => {
  try {
    // Get all boards where user is a member
    const boards = await Board.find({ 'members.user': req.userId });
    const boardIds = boards.map(board => board._id);

    // Get all tasks from these boards
    const tasks = await Task.find({ board: { $in: boardIds } })
      .populate('createdBy', 'username')
      .populate('board', 'title')
      .sort('-createdAt')
      .limit(50);

    res.json(tasks);
  } catch (error) {
    console.error('Failed to fetch tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

module.exports = router;