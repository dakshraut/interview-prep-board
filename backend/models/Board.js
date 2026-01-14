const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteLink: {
    type: String,
    unique: true
  },
  columns: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['todo', 'inprogress', 'review', 'done', 'backlog', 'blocked'],
      default: 'todo'
    },
    order: Number,
    color: String,
    limit: Number,
    wipLimit: Number
  }],
  taskTypes: [{
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      default: '#6B7280'
    },
    icon: {
      type: String,
      default: '📝'
    },
    description: String,
    order: Number,
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  labels: [{
    name: String,
    color: String,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    allowComments: {
      type: Boolean,
      default: true
    },
    allowAttachments: {
      type: Boolean,
      default: true
    },
    allowTimeTracking: {
      type: Boolean,
      default: false
    },
    enableDueDates: {
      type: Boolean,
      default: true
    },
    enableLabels: {
      type: Boolean,
      default: true
    },
    enableChecklists: {
      type: Boolean,
      default: false
    },
    enableVoting: {
      type: Boolean,
      default: false
    },
    enableCustomFields: {
      type: Boolean,
      default: false
    },
    defaultView: {
      type: String,
      enum: ['board', 'list', 'calendar', 'timeline'],
      default: 'board'
    },
    cardCover: {
      type: Boolean,
      default: false
    }
  },
  customFields: [{
    name: String,
    type: {
      type: String,
      enum: ['text', 'number', 'date', 'dropdown', 'checkbox']
    },
    options: [String],
    required: Boolean,
    defaultValue: mongoose.Schema.Types.Mixed
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

boardSchema.pre('save', function(next) {
  if (!this.inviteLink) {
    this.inviteLink = `invite-${Math.random().toString(36).substr(2, 9)}-${Date.now().toString(36)}`;
  }
  
  // Set default task types if none provided
  if (!this.taskTypes || this.taskTypes.length === 0) {
    this.taskTypes = [
      { name: 'DSA Problem', color: '#3B82F6', icon: '🧠', order: 0 },
      { name: 'HR Question', color: '#8B5CF6', icon: '👥', order: 1 },
      { name: 'System Design', color: '#10B981', icon: '🏗️', order: 2 },
      { name: 'Coding Challenge', color: '#F59E0B', icon: '💻', order: 3 },
      { name: 'Behavioral', color: '#EF4444', icon: '💬', order: 4 },
      { name: 'Project', color: '#EC4899', icon: '📁', order: 5 },
      { name: 'Research', color: '#14B8A6', icon: '🔍', order: 6 },
      { name: 'Revision', color: '#6366F1', icon: '📚', order: 7 },
      { name: 'Mock Interview', color: '#F97316', icon: '🎤', order: 8 },
      { name: 'Algorithm', color: '#8B5CF6', icon: '⚡', order: 9 },
      { name: 'Database', color: '#10B981', icon: '🗄️', order: 10 },
      { name: 'API Design', color: '#F59E0B', icon: '🔌', order: 11 },
      { name: 'Security', color: '#EF4444', icon: '🔒', order: 12 },
      { name: 'Testing', color: '#8B5CF6', icon: '🧪', order: 13 },
      { name: 'Deployment', color: '#10B981', icon: '🚀', order: 14 },
      { name: 'Documentation', color: '#6B7280', icon: '📄', order: 15 },
      { name: 'Bug Fix', color: '#DC2626', icon: '🐛', order: 16 },
      { name: 'Code Review', color: '#3B82F6', icon: '👁️', order: 17 },
      { name: 'Refactoring', color: '#8B5CF6', icon: '♻️', order: 18 },
      { name: 'Performance', color: '#F59E0B', icon: '⚡', order: 19 },
      { name: 'General', color: '#6B7280', icon: '📝', order: 100 }
    ];
  }
  
  // Set default columns if none provided
  if (!this.columns || this.columns.length === 0) {
    this.columns = [
      { title: 'Backlog', type: 'backlog', order: 0, color: '#94A3B8', wipLimit: null },
      { title: 'Ready', type: 'todo', order: 1, color: '#3B82F6', wipLimit: null },
      { title: 'In Progress', type: 'inprogress', order: 2, color: '#F59E0B', wipLimit: 5 },
      { title: 'Code Review', type: 'review', order: 3, color: '#8B5CF6', wipLimit: 3 },
      { title: 'Testing', type: 'review', order: 4, color: '#EC4899', wipLimit: 3 },
      { title: 'Blocked', type: 'blocked', order: 5, color: '#EF4444', wipLimit: null },
      { title: 'Done', type: 'done', order: 6, color: '#10B981', wipLimit: null }
    ];
  }
  
  // Set default labels if none provided
  if (!this.labels || this.labels.length === 0) {
    this.labels = [
      { name: 'Bug', color: '#EF4444', isActive: true },
      { name: 'Feature', color: '#10B981', isActive: true },
      { name: 'Enhancement', color: '#3B82F6', isActive: true },
      { name: 'Documentation', color: '#8B5CF6', isActive: true },
      { name: 'Question', color: '#F59E0B', isActive: true },
      { name: 'Urgent', color: '#DC2626', isActive: true },
      { name: 'High Priority', color: '#F59E0B', isActive: true },
      { name: 'Low Priority', color: '#6B7280', isActive: true },
      { name: 'In Progress', color: '#3B82F6', isActive: true },
      { name: 'Ready for Review', color: '#8B5CF6', isActive: true }
    ];
  }
  
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
boardSchema.index({ owner: 1 });
boardSchema.index({ 'members.user': 1 });
boardSchema.index({ createdAt: -1 });
boardSchema.index({ inviteLink: 1 });
boardSchema.index({ isArchived: 1 });

// Virtual for active task count
boardSchema.virtual('activeTaskCount').get(async function() {
  const Task = mongoose.model('Task');
  const count = await Task.countDocuments({ 
    board: this._id, 
    isArchived: false 
  });
  return count;
});

// Virtual for completed task count
boardSchema.virtual('completedTaskCount').get(async function() {
  const Task = mongoose.model('Task');
  const count = await Task.countDocuments({ 
    board: this._id, 
    column: 'done' 
  });
  return count;
});

boardSchema.set('toJSON', { virtuals: true });
boardSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Board', boardSchema);