// Input validation utilities
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

const validateUsername = (username) => {
  return username && username.length >= 3 && username.length <= 30;
};

const validateBoardTitle = (title) => {
  return title && title.trim().length > 0 && title.trim().length <= 100;
};

const validateTaskTitle = (title) => {
  return title && title.trim().length > 0 && title.trim().length <= 200;
};

const validateMongoId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

const validateDifficulty = (difficulty) => {
  return ['Easy', 'Medium', 'Hard', 'Very Hard'].includes(difficulty);
};

const validatePriority = (priority) => {
  return ['Low', 'Medium', 'High', 'Critical'].includes(priority);
};

const validateColumn = (column) => {
  return ['todo', 'inprogress', 'review', 'done', 'backlog', 'blocked'].includes(column);
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateBoardTitle,
  validateTaskTitle,
  validateMongoId,
  validateDifficulty,
  validatePriority,
  validateColumn
};
