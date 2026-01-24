const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Task = require('../models/Task');
const Board = require('../models/Board');
const User = require('../models/User');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, docs, and archives are allowed.'));
    }
  }
});

// Middleware
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

// Get task by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('createdBy', 'username email avatar')
      .populate('assignedTo.user', 'username email avatar')
      .populate('comments.user', 'username email avatar')
      .populate('attachments.uploadedBy', 'username email');
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// Create task with file upload
router.post('/', authenticate, upload.single('attachment'), async (req, res) => {
  try {
    let taskData = req.body.data ? JSON.parse(req.body.data) : req.body;
    const { boardId } = taskData;
    
    if (!boardId) {
      return res.status(400).json({ error: 'Board ID is required' });
    }

    if (!taskData.title || !taskData.title.trim()) {
      return res.status(400).json({ error: 'Task title is required' });
    }
    
    // Check if user has access to board
    const board = await Board.findOne({
      _id: boardId,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate task type against board's task types
    const validTypes = board.taskTypes.map(t => t.name);
    if (taskData.type && !validTypes.includes(taskData.type) && taskData.type !== 'General') {
      return res.status(400).json({ error: 'Invalid task type' });
    }

    // Get highest order for the column
    const lastTask = await Task.findOne({ board: boardId, column: taskData.column || 'todo' }).sort('-order');
    const order = lastTask ? lastTask.order + 1 : 0;

    // Prepare task data
    const task = new Task({
      title: taskData.title.trim(),
      description: taskData.description || '',
      type: taskData.type || 'General',
      difficulty: taskData.difficulty || 'Medium',
      priority: taskData.priority || 'Medium',
      company: taskData.company || '',
      board: boardId,
      createdBy: req.userId,
      order,
      column: taskData.column || 'todo',
      status: taskData.status || 'Not Started',
      dueDate: taskData.dueDate || null,
      estimatedTime: taskData.estimatedTime || 0,
      tags: taskData.tags ? (Array.isArray(taskData.tags) ? taskData.tags : taskData.tags.split(',').map(t => t.trim())) : [],
      assignedTo: taskData.assignedTo ? (Array.isArray(taskData.assignedTo) ? taskData.assignedTo.map(userId => ({ user: userId })) : []) : []
    });

    // Handle file attachment
    if (req.file) {
      task.attachments.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        type: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.userId
      });
    }

    await task.save();
    
    // Populate user data
    await task.populate('createdBy', 'username email avatar');
    await task.populate('assignedTo.user', 'username email avatar');
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(boardId).emit('taskUpdated', {
      type: 'created',
      task
    });

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: error.message || 'Failed to create task' });
  }
});

// Update task
router.put('/:id', authenticate, upload.single('attachment'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    // Handle file attachment
    if (req.file) {
      updateData.attachments = updateData.attachments || [];
      updateData.attachments.push({
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        type: req.file.mimetype,
        size: req.file.size,
        uploadedBy: req.userId
      });
    }

    // Handle tags conversion
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim());
    }

    // Handle assignedTo conversion
    if (updateData.assignedTo && typeof updateData.assignedTo[0] === 'string') {
      updateData.assignedTo = updateData.assignedTo.map(userId => ({ user: userId }));
    }

    Object.assign(task, updateData);
    await task.save();
    
    // Populate user data
    await task.populate('createdBy', 'username email avatar');
    await task.populate('assignedTo.user', 'username email avatar');
    await task.populate('comments.user', 'username email avatar');
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'updated',
      task
    });

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId,
      'members.role': 'admin'
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied or not admin' });
    }

    // Delete associated files
    if (task.attachments && task.attachments.length > 0) {
      task.attachments.forEach(attachment => {
        const filePath = path.join(__dirname, '..', attachment.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }

    await task.deleteOne();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'deleted',
      taskId: task._id
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Archive task (soft delete)
router.post('/:id/archive', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    task.isArchived = true;
    task.archivedAt = new Date();
    await task.save();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'archived',
      task
    });

    res.json(task);
  } catch (error) {
    console.error('Archive task error:', error);
    res.status(500).json({ error: 'Failed to archive task' });
  }
});

// Restore archived task
router.post('/:id/restore', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    task.isArchived = false;
    task.archivedAt = null;
    await task.save();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'restored',
      task
    });

    res.json(task);
  } catch (error) {
    console.error('Restore task error:', error);
    res.status(500).json({ error: 'Failed to restore task' });
  }
});

// Add comment to task
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = {
      user: req.userId,
      text: text.trim(),
      createdAt: new Date()
    };

    task.comments.push(comment);
    await task.save();
    
    await task.populate('comments.user', 'username email avatar');
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'commented',
      task,
      comment: task.comments[task.comments.length - 1]
    });

    res.json(task.comments[task.comments.length - 1]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update comment
router.put('/:id/comments/:commentId', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = task.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.user.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only edit your own comments' });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    
    await task.save();
    await task.populate('comments.user', 'username email avatar');
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'commentUpdated',
      task,
      comment
    });

    res.json(comment);
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const comment = task.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if user is the comment author or admin
    const isAdmin = board.members.some(m => 
      m.user.toString() === req.userId && m.role === 'admin'
    );
    
    if (comment.user.toString() !== req.userId && !isAdmin) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    comment.remove();
    await task.save();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'commentDeleted',
      task,
      commentId: req.params.commentId
    });

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Add checklist item
router.post('/:id/checklist', authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Checklist item text is required' });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklistItem = {
      text: text.trim(),
      completed: false
    };

    task.checklist.push(checklistItem);
    await task.save();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'checklistAdded',
      task,
      checklistItem
    });

    res.json(checklistItem);
  } catch (error) {
    console.error('Add checklist error:', error);
    res.status(500).json({ error: 'Failed to add checklist item' });
  }
});

// Toggle checklist item
router.put('/:id/checklist/:itemId', authenticate, async (req, res) => {
  try {
    const { completed } = req.body;
    
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklistItem = task.checklist.id(req.params.itemId);
    
    if (!checklistItem) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    checklistItem.completed = completed !== undefined ? completed : !checklistItem.completed;
    
    if (checklistItem.completed) {
      checklistItem.completedAt = new Date();
    } else {
      checklistItem.completedAt = null;
    }
    
    await task.save();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'checklistUpdated',
      task,
      checklistItem
    });

    res.json(checklistItem);
  } catch (error) {
    console.error('Toggle checklist error:', error);
    res.status(500).json({ error: 'Failed to toggle checklist item' });
  }
});

// Delete checklist item
router.delete('/:id/checklist/:itemId', authenticate, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const checklistItem = task.checklist.id(req.params.itemId);
    
    if (!checklistItem) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    checklistItem.remove();
    await task.save();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'checklistDeleted',
      task,
      itemId: req.params.itemId
    });

    res.json({ message: 'Checklist item deleted successfully' });
  } catch (error) {
    console.error('Delete checklist error:', error);
    res.status(500).json({ error: 'Failed to delete checklist item' });
  }
});

// Log time spent
router.post('/:id/log-time', authenticate, async (req, res) => {
  try {
    const { minutes, description } = req.body;
    
    if (!minutes || minutes <= 0) {
      return res.status(400).json({ error: 'Valid minutes are required' });
    }

    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has access to the board
    const board = await Board.findOne({
      _id: task.board,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    task.timeSpent = (task.timeSpent || 0) + Number(minutes);
    
    // Add time log entry
    if (!task.timeLogs) task.timeLogs = [];
    task.timeLogs.push({
      user: req.userId,
      minutes: Number(minutes),
      description: description?.trim(),
      loggedAt: new Date()
    });
    
    await task.save();
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(task.board.toString()).emit('taskUpdated', {
      type: 'timeLogged',
      task,
      minutes: Number(minutes)
    });

    res.json({ 
      timeSpent: task.timeSpent,
      timeLogs: task.timeLogs 
    });
  } catch (error) {
    console.error('Log time error:', error);
    res.status(500).json({ error: 'Failed to log time' });
  }
});

// Get tasks for board
router.get('/board/:boardId', authenticate, async (req, res) => {
  try {
    const { type, difficulty, priority, status, assignedTo, search } = req.query;
    
    const board = await Board.findOne({
      _id: req.params.boardId,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const query = { board: req.params.boardId, isArchived: false };
    
    // Apply filters
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    if (priority) query.priority = priority;
    if (status) query.status = status;
    if (assignedTo) query['assignedTo.user'] = assignedTo;
    
    // Search across multiple fields
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const tasks = await Task.find(query)
      .populate('createdBy', 'username email avatar')
      .populate('assignedTo.user', 'username email avatar')
      .sort('order');

    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get archived tasks for board
router.get('/board/:boardId/archived', authenticate, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.boardId,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.find({ 
      board: req.params.boardId, 
      isArchived: true 
    })
      .populate('createdBy', 'username email avatar')
      .populate('assignedTo.user', 'username email avatar')
      .sort('-archivedAt');

    res.json(tasks);
  } catch (error) {
    console.error('Fetch archived tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch archived tasks' });
  }
});

// Reorder tasks
router.post('/reorder', authenticate, async (req, res) => {
  try {
    const { boardId, tasks } = req.body;
    
    // Check if user has access to board
    const board = await Board.findOne({
      _id: boardId,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update all tasks
    const bulkOps = tasks.map((task, index) => ({
      updateOne: {
        filter: { _id: task._id, board: boardId },
        update: { 
          $set: { 
            column: task.column, 
            order: index,
            updatedAt: new Date()
          }
        }
      }
    }));

    await Task.bulkWrite(bulkOps);
    
    // Get updated tasks
    const updatedTasks = await Task.find({ board: boardId })
      .populate('createdBy', 'username email avatar')
      .populate('assignedTo.user', 'username email avatar')
      .sort('order');
    
    // Emit socket event
    const io = req.app.get('socketio');
    io.to(boardId).emit('taskUpdated', {
      type: 'reordered',
      tasks: updatedTasks
    });

    res.json({ message: 'Tasks reordered successfully', tasks: updatedTasks });
  } catch (error) {
    console.error('Reorder tasks error:', error);
    res.status(500).json({ error: 'Failed to reorder tasks' });
  }
});

// Get task statistics for board
router.get('/board/:boardId/stats', authenticate, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.boardId,
      'members.user': req.userId
    });
    
    if (!board) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await Task.find({ board: req.params.boardId, isArchived: false });
    
    const stats = {
      total: tasks.length,
      byType: tasks.reduce((acc, task) => {
        acc[task.type] = (acc[task.type] || 0) + 1;
        return acc;
      }, {}),
      byDifficulty: tasks.reduce((acc, task) => {
        acc[task.difficulty] = (acc[task.difficulty] || 0) + 1;
        return acc;
      }, {}),
      byPriority: tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {}),
      byStatus: tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}),
      byColumn: tasks.reduce((acc, task) => {
        acc[task.column] = (acc[task.column] || 0) + 1;
        return acc;
      }, {}),
      overdue: tasks.filter(task => {
        if (!task.dueDate) return false;
        return new Date() > new Date(task.dueDate) && task.status !== 'Completed';
      }).length,
      completed: tasks.filter(task => task.column === 'done').length,
      inProgress: tasks.filter(task => task.column === 'inprogress').length,
      blocked: tasks.filter(task => task.column === 'blocked').length,
      totalTimeSpent: tasks.reduce((sum, task) => sum + (task.timeSpent || 0), 0),
      totalEstimatedTime: tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0)
    };

    res.json(stats);
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Failed to get task statistics' });
  }
});

module.exports = router;