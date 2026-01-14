const express = require('express');
const jwt = require('jsonwebtoken');
const Task = require('../models/Task');
const Board = require('../models/Board');
const User = require('../models/User');
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

// Get all activities for user
router.get('/', authenticate, async (req, res) => {
  try {
    const { type, action, limit = 50, offset = 0 } = req.query;
    
    // Get user's boards
    const boards = await Board.find({ 'members.user': req.userId });
    const boardIds = boards.map(board => board._id);

    // Build query for tasks
    let taskQuery = { board: { $in: boardIds } };
    
    if (type === 'task') {
      // Only tasks
    } else if (type === 'board') {
      taskQuery = null; // Don't fetch tasks
    }
    
    if (action) {
      if (action === 'completed') {
        taskQuery.column = 'done';
      } else if (action === 'started') {
        taskQuery.column = 'inprogress';
      } else if (action === 'review') {
        taskQuery.column = 'review';
      }
    }

    // Fetch tasks if needed
    const tasks = taskQuery ? await Task.find(taskQuery)
      .populate('createdBy', 'username')
      .populate('board', 'title')
      .sort('-updatedAt')
      .skip(parseInt(offset))
      .limit(parseInt(limit)) : [];

    // Build query for boards
    let boardQuery = { 'members.user': req.userId };
    
    if (type === 'board') {
      // Only boards
    } else if (type === 'task') {
      boardQuery = null; // Don't fetch boards
    }

    const boardsData = boardQuery ? await Board.find(boardQuery)
      .populate('owner', 'username')
      .sort('-createdAt')
      .skip(parseInt(offset))
      .limit(parseInt(limit)) : [];

    // Combine and format activities
    const activities = [
      ...tasks.map(task => ({
        id: task._id,
        type: 'task',
        action: getTaskAction(task),
        title: task.title,
        description: task.description,
        entity: {
          id: task._id,
          type: task.type,
          difficulty: task.difficulty,
          column: task.column,
          company: task.company,
          tags: task.tags
        },
        timestamp: task.updatedAt || task.createdAt,
        user: {
          id: task.createdBy._id,
          username: task.createdBy.username
        },
        board: {
          id: task.board?._id,
          title: task.board?.title
        }
      })),
      ...boardsData.map(board => ({
        id: board._id,
        type: 'board',
        action: 'created',
        title: board.title,
        description: board.description,
        entity: {
          id: board._id,
          members: board.members.length,
          visibility: board.visibility
        },
        timestamp: board.createdAt,
        user: {
          id: board.owner._id,
          username: board.owner.username
        }
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, parseInt(limit));

    // Get activity stats
    const stats = {
      total: activities.length,
      tasks: activities.filter(a => a.type === 'task').length,
      boards: activities.filter(a => a.type === 'board').length,
      completed: activities.filter(a => a.action === 'completed').length,
      inProgress: activities.filter(a => a.action === 'started').length
    };

    res.json({
      activities,
      stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: activities.length
      }
    });
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// Get activity stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    // Get user's boards
    const boards = await Board.find({ 'members.user': req.userId });
    const boardIds = boards.map(board => board._id);

    // Get all tasks
    const tasks = await Task.find({ board: { $in: boardIds } });

    // Calculate stats
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.column === 'done').length,
      inProgressTasks: tasks.filter(t => t.column === 'inprogress').length,
      pendingTasks: tasks.filter(t => t.column === 'todo').length,
      totalBoards: boards.length,
      byType: {
        DSA: tasks.filter(t => t.type === 'DSA').length,
        HR: tasks.filter(t => t.type === 'HR').length,
        SystemDesign: tasks.filter(t => t.type === 'System Design').length
      },
      recentActivity: tasks.length + boards.length,
      weeklyCompletion: calculateWeeklyCompletion(tasks)
    };

    res.json(stats);
  } catch (error) {
    console.error('Failed to fetch activity stats:', error);
    res.status(500).json({ error: 'Failed to fetch activity stats' });
  }
});

function getTaskAction(task) {
  if (task.column === 'done') return 'completed';
  if (task.column === 'inprogress') return 'started';
  if (task.column === 'review') return 'submitted_for_review';
  return 'created';
}

function calculateWeeklyCompletion(tasks) {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  const recentTasks = tasks.filter(t => new Date(t.updatedAt) > oneWeekAgo);
  const completedThisWeek = recentTasks.filter(t => t.column === 'done').length;
  
  return {
    total: recentTasks.length,
    completed: completedThisWeek,
    rate: recentTasks.length > 0 ? Math.round((completedThisWeek / recentTasks.length) * 100) : 0
  };
}

module.exports = router;