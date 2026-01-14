const express = require('express');
const Board = require('../models/Board');
const Task = require('../models/Task');
const authenticate = require('../middleware/authMiddleware');
const { asyncHandler, AppError } = require('../utils/errorHandler');
const { validateBoardTitle, validateMongoId } = require('../utils/validators');
const router = express.Router();

// Create board
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { title, description, visibility = 'private' } = req.body;
  
  if (!validateBoardTitle(title)) {
    throw new AppError('Board title is required and must be 1-100 characters', 400);
  }
  
  const defaultColumns = [
    { title: 'To Do', type: 'todo', order: 0 },
    { title: 'In Progress', type: 'inprogress', order: 1 },
    { title: 'Review', type: 'review', order: 2 },
    { title: 'Done', type: 'done', order: 3 }
  ];

  const board = new Board({
    title: title.trim(),
    description: description?.trim(),
    owner: req.userId,
    members: [{ user: req.userId, role: 'admin' }],
    columns: defaultColumns,
    visibility
  });

  await board.save();
  await board.populate('owner', 'username email avatar');
  
  res.status(201).json({
    success: true,
    data: board
  });
}));


// Get user's boards
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const boards = await Board.find({
    'members.user': req.userId
  })
    .populate('owner', 'username email avatar')
    .sort('-createdAt');
  
  res.json({
    success: true,
    count: boards.length,
    data: boards
  });
}));

// Get board by ID
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!validateMongoId(req.params.id)) {
    throw new AppError('Invalid board ID', 400);
  }

  const board = await Board.findById(req.params.id)
    .populate('owner', 'username email avatar')
    .populate('members.user', 'username email avatar');
  
  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Check if user is member
  const isMember = board.members.some(m => m.user._id.toString() === req.userId);
  if (!isMember) {
    throw new AppError('Access denied', 403);
  }

  res.json({
    success: true,
    data: board
  });
}));


// Join board via invite link
router.post('/join/:inviteLink', authenticate, asyncHandler(async (req, res) => {
  const board = await Board.findOne({ inviteLink: req.params.inviteLink });
  
  if (!board) {
    throw new AppError('Invalid invite link', 404);
  }

  // Check if already member
  const isMember = board.members.some(m => m.user.toString() === req.userId);
  if (isMember) {
    throw new AppError('You are already a member of this board', 400);
  }

  board.members.push({ user: req.userId, role: 'member' });
  await board.save();
  
  await board.populate('owner', 'username email avatar');
  
  res.json({
    success: true,
    data: board
  });
}));

// Add to existing file after other routes


// Leave board
router.delete('/:id/leave', authenticate, asyncHandler(async (req, res) => {
  if (!validateMongoId(req.params.id)) {
    throw new AppError('Invalid board ID', 400);
  }

  const board = await Board.findById(req.params.id);
  
  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Remove user from members
  board.members = board.members.filter(m => m.user.toString() !== req.userId);
  
  // If no members left, delete the board
  if (board.members.length === 0) {
    await board.deleteOne();
    await Task.deleteMany({ board: board._id });
    return res.json({ 
      success: true,
      message: 'Board deleted as no members left' 
    });
  }

  // If owner left, transfer ownership to first admin or first member
  if (board.owner.toString() === req.userId) {
    const admin = board.members.find(m => m.role === 'admin');
    if (admin) {
      board.owner = admin.user;
    } else {
      board.owner = board.members[0].user;
      board.members[0].role = 'admin';
    }
  }

  await board.save();
  res.json({ 
    success: true,
    message: 'Successfully left the board' 
  });
}));


// Update board
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!validateMongoId(req.params.id)) {
    throw new AppError('Invalid board ID', 400);
  }

  const board = await Board.findById(req.params.id);
  
  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Check if user is admin
  const isAdmin = board.members.some(m => 
    m.user.toString() === req.userId && m.role === 'admin'
  );
  
  if (!isAdmin) {
    throw new AppError('Only admins can update board', 403);
  }

  // Only allow updating certain fields
  const allowedFields = ['title', 'description', 'visibility'];
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  Object.assign(board, updates);
  await board.save();
  
  res.json({
    success: true,
    data: board
  });
}));


// Get board analytics
router.get('/:id/analytics', authenticate, asyncHandler(async (req, res) => {
  if (!validateMongoId(req.params.id)) {
    throw new AppError('Invalid board ID', 400);
  }

  const board = await Board.findById(req.params.id);
  
  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Check if user is member
  const isMember = board.members.some(m => m.user.toString() === req.userId);
  if (!isMember) {
    throw new AppError('Access denied', 403);
  }

  const tasks = await Task.find({ board: req.params.id });
  
  const analytics = {
    totalTasks: tasks.length,
    completedTasks: tasks.filter(t => t.column === 'done').length,
    inProgressTasks: tasks.filter(t => t.column === 'inprogress').length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.column === 'done').length / tasks.length) * 100) : 0,
    byType: tasks.reduce((acc, task) => {
      acc[task.type] = (acc[task.type] || 0) + 1;
      return acc;
    }, {}),
    byDifficulty: {
      Easy: tasks.filter(t => t.difficulty === 'Easy').length,
      Medium: tasks.filter(t => t.difficulty === 'Medium').length,
      Hard: tasks.filter(t => t.difficulty === 'Hard').length,
      'Very Hard': tasks.filter(t => t.difficulty === 'Very Hard').length
    },
    byCompany: tasks.reduce((acc, task) => {
      if (task.company) {
        acc[task.company] = (acc[task.company] || 0) + 1;
      }
      return acc;
    }, {}),
    recentActivity: tasks
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 10)
      .map(task => ({
        id: task._id,
        title: task.title,
        action: task.column === 'done' ? 'completed' : 'updated',
        timestamp: task.updatedAt
      })),
    memberStats: board.members.map(member => ({
      userId: member.user,
      role: member.role,
      taskCount: tasks.filter(t => t.createdBy.toString() === member.user.toString()).length
    }))
  };

  res.json({
    success: true,
    data: analytics
  });
}));

// Delete board
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  if (!validateMongoId(req.params.id)) {
    throw new AppError('Invalid board ID', 400);
  }

  const board = await Board.findById(req.params.id);
  
  if (!board) {
    throw new AppError('Board not found', 404);
  }

  // Check if user is owner
  if (board.owner.toString() !== req.userId) {
    throw new AppError('Only board owner can delete the board', 403);
  }

  // Delete all tasks associated with this board
  await Task.deleteMany({ board: req.params.id });
  await board.deleteOne();
  
  res.json({
    success: true,
    message: 'Board deleted successfully'
  });
}));

module.exports = router;