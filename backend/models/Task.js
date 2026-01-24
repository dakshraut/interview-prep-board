const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    required: true,
    default: 'General'
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard', 'Very Hard'],
    default: 'Medium'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  company: String,
  tags: [String],
  column: {
    type: String,
    enum: ['todo', 'inprogress', 'review', 'done', 'backlog', 'blocked'],
    default: 'todo'
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    }
  }],
  order: Number,
  dueDate: Date,
  startDate: Date,
  estimatedTime: Number,
  timeSpent: {
    type: Number,
    default: 0
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],
  checklist: [{
    text: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  status: {
    type: String,
    enum: ['Not Started', 'In Progress', 'In Review', 'Blocked', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Not Started'
  },
  labels: [{
    name: String,
    color: String
  }],
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: Date,
  completedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

taskSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Update status based on column
  if (this.column === 'done') {
    this.status = 'Completed';
    this.completedAt = new Date();
  } else if (this.column === 'blocked') {
    this.status = 'Blocked';
  } else if (this.column === 'inprogress') {
    this.status = 'In Progress';
  }
  
  next();
});

// Virtual for progress percentage
taskSchema.virtual('progress').get(function() {
  if (this.checklist && this.checklist.length > 0) {
    const completed = this.checklist.filter(item => item.completed).length;
    return Math.round((completed / this.checklist.length) * 100);
  }
  return 0;
});

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate) return false;
  return new Date() > new Date(this.dueDate) && this.status !== 'Completed';
});

// Virtual for time remaining
taskSchema.virtual('timeRemaining').get(function() {
  if (!this.dueDate) return null;
  const now = new Date();
  const due = new Date(this.dueDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24)); // Days remaining
});

// Indexes for better query performance
taskSchema.index({ board: 1 });
taskSchema.index({ board: 1, column: 1 });
taskSchema.index({ board: 1, isArchived: 1 });
taskSchema.index({ createdBy: 1 });
taskSchema.index({ 'assignedTo.user': 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ createdAt: -1 });

taskSchema.set('toJSON', { virtuals: true });
taskSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);