const MOVE_STATUSES = ['Planning', 'In Progress', 'Moving Day', 'Completed', 'Cancelled'];

const TASK_STATUSES = ['Pending', 'In Progress', 'Completed'];

const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

const BOX_STATUSES = [
  'Not Started',
  'Packing',
  'Packed',
  'Loaded',
  'In Transit',
  'Delivered',
  'Missing'
];

const EXPENSE_CATEGORIES = [
  'Movers',
  'Packing Supplies',
  'Truck Rental',
  'Storage',
  'Cleaning',
  'Utilities',
  'Food & Travel',
  'Other'
];

const SERVICE_TYPES = [
  'Moving Company',
  'Electricity Transfer',
  'Water Service',
  'Internet / Cable',
  'Gas Connection',
  'Cleaning Service',
  'Locksmith',
  'Other'
];

const SERVICE_STATUSES = [
  'Inquired',
  'Booked',
  'Confirmed',
  'Completed',
  'Cancelled'
];

const ACTIVITY_ENTITIES = [
  'Move',
  'Task',
  'Box',
  'Item',
  'Expense',
  'Booking',
  'Member'
];

module.exports = {
  MOVE_STATUSES,
  TASK_STATUSES,
  TASK_PRIORITIES,
  BOX_STATUSES,
  EXPENSE_CATEGORIES,
  SERVICE_TYPES,
  SERVICE_STATUSES,
  ACTIVITY_ENTITIES
};

