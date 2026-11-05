const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('../src/config/database');
const {
  User,
  Move,
  MoveMember,
  Room,
  Box,
  InventoryItem,
  Task,
  Expense,
  ServiceBooking,
  ActivityLog
} = require('../src/models');

const runModelTests = async () => {
  console.log('🧪 Starting Phase 3 Mongoose Models & Validation Tests...\n');

  try {
    const conn = await connectDB();
    if (!conn) {
      throw new Error('Failed to connect to MongoDB Atlas');
    }

    // Test 1: Verify all 10 models are registered
    console.log('Test 1: Verify all 10 Mongoose models are properly registered');
    const registeredModels = Object.keys(mongoose.models);
    const expectedModels = [
      'User',
      'Move',
      'MoveMember',
      'Room',
      'Box',
      'InventoryItem',
      'Task',
      'Expense',
      'ServiceBooking',
      'ActivityLog'
    ];

    expectedModels.forEach((modelName) => {
      if (!registeredModels.includes(modelName)) {
        throw new Error(`Model ${modelName} is not registered in Mongoose`);
      }
    });
    console.log(`✅ All ${expectedModels.length} models successfully registered:`, registeredModels.join(', '), '\n');

    // Test 2: Validation test - User schema validation (Invalid email & short password)
    console.log('Test 2: User schema validation (invalid email & short password)');
    const invalidUser = new User({
      name: 'A',
      email: 'not-an-email',
      password: 'short'
    });

    const validationError = invalidUser.validateSync();
    if (!validationError) {
      throw new Error('Expected validation error for invalid user, but passed');
    }
    console.log('Validation caught expected errors:');
    Object.keys(validationError.errors).forEach((key) => {
      console.log(` - ${key}: ${validationError.errors[key].message}`);
    });
    console.log('✅ Test 2 Passed!\n');

    // Test 3: Password projection security check (select: false)
    console.log('Test 3: Password projection security check (select: false)');
    const passwordField = User.schema.paths.password;
    if (passwordField.options.select !== false) {
      throw new Error('User password field must have select: false for security');
    }
    console.log('User schema password select option:', passwordField.options.select);
    console.log('✅ Test 3 Passed!\n');

    // Test 4: Compound unique indexes check
    console.log('Test 4: Compound unique indexes verification');
    const moveMemberIndexes = MoveMember.schema.indexes();
    const boxIndexes = Box.schema.indexes();
    const roomIndexes = Room.schema.indexes();

    const hasMoveMemberUnique = moveMemberIndexes.some(
      (idx) => idx[0].moveId === 1 && idx[0].userId === 1 && idx[1].unique === true
    );
    const hasBoxLabelUnique = boxIndexes.some(
      (idx) => idx[0].moveId === 1 && idx[0].boxLabel === 1 && idx[1].unique === true
    );
    const hasRoomNameUnique = roomIndexes.some(
      (idx) => idx[0].moveId === 1 && idx[0].name === 1 && idx[1].unique === true
    );

    if (!hasMoveMemberUnique) throw new Error('MoveMember missing compound unique index on { moveId: 1, userId: 1 }');
    if (!hasBoxLabelUnique) throw new Error('Box missing compound unique index on { moveId: 1, boxLabel: 1 }');
    if (!hasRoomNameUnique) throw new Error('Room missing compound unique index on { moveId: 1, name: 1 }');

    console.log('MoveMember { moveId: 1, userId: 1 } unique:', hasMoveMemberUnique ? '✅' : '❌');
    console.log('Box { moveId: 1, boxLabel: 1 } unique:', hasBoxLabelUnique ? '✅' : '❌');
    console.log('Room { moveId: 1, name: 1 } unique:', hasRoomNameUnique ? '✅' : '❌');
    console.log('✅ Test 4 Passed!\n');

    // Test 5: End-to-end database write and cleanup test
    console.log('Test 5: End-to-end database write and cleanup test');
    const testEmail = `test_${Date.now()}@movematetest.local`;
    const createdUser = await User.create({
      name: 'MoveMate Test User',
      email: testEmail,
      password: 'ValidPassword123!',
      phone: '+1000000000'
    });

    console.log('Created temporary test user with ID:', createdUser._id.toString());

    // Verify password is not in JSON representation
    const userJson = createdUser.toJSON();
    if (userJson.password) {
      throw new Error('User toJSON() leaked password field!');
    }
    console.log('User JSON serialization protected (password stripped): ✅');

    // Clean up test user
    await User.findByIdAndDelete(createdUser._id);
    console.log('Temporary test user cleaned up successfully.');
    console.log('✅ Test 5 Passed!\n');

    console.log('🎉 ALL PHASE 3 MODEL TESTS PASSED SUCCESSFULLY!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    console.error('❌ Model test error:', err.message);
    await disconnectDB();
    process.exit(1);
  }
};

runModelTests();

