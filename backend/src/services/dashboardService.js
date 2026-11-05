const Task = require('../models/Task');
const Box = require('../models/Box');
const InventoryItem = require('../models/InventoryItem');
const ServiceBooking = require('../models/ServiceBooking');
const Expense = require('../models/Expense');
const Move = require('../models/Move');
const ApiError = require('../utils/apiError');

/**
 * Calculate the 4-Pillar Weighted Moving Readiness Dashboard
 * Weights:
 * - Essential Tasks: 35%
 * - Box Packing Progress: 30%
 * - Room Inventory Completion: 20%
 * - Utility & Service Bookings: 15%
 */
const getMoveDashboard = async (moveId) => {
  const move = await Move.findById(moveId);
  if (!move) throw new ApiError(404, 'Moving plan not found');

  const now = new Date();

  // Run all count and query aggregations in parallel for maximum performance
  const [
    tasks,
    boxes,
    items,
    bookings,
    expenses
  ] = await Promise.all([
    Task.find({ moveId }),
    Box.find({ moveId }),
    InventoryItem.find({ moveId }),
    ServiceBooking.find({ moveId }),
    Expense.find({ moveId })
  ]);

  // ── 1. Tasks & Pillar 1 (35%) ───────────────────────────────────────────
  let totalTasks = tasks.length;
  let completedTasks = 0;
  let pendingTasks = 0;
  let overdueTasks = 0;
  let essentialTotal = 0;
  let essentialCompleted = 0;

  tasks.forEach((t) => {
    const isDone = t.status === 'Completed';
    if (isDone) completedTasks += 1;
    else pendingTasks += 1;

    if (!isDone && t.dueDate && new Date(t.dueDate) < now) {
      overdueTasks += 1;
    }

    if (t.isEssential) {
      essentialTotal += 1;
      if (isDone) essentialCompleted += 1;
    }
  });

  let pillar1Score = 0;
  let pillar1Pct = 0;
  if (essentialTotal > 0) {
    pillar1Pct = Math.round((essentialCompleted / essentialTotal) * 100);
    pillar1Score = (essentialCompleted / essentialTotal) * 35;
  } else if (totalTasks > 0) {
    // Fallback if no essential tasks are flagged yet
    pillar1Pct = Math.round((completedTasks / totalTasks) * 100);
    pillar1Score = (completedTasks / totalTasks) * 35;
  }

  // ── 2. Boxes & Pillar 2 (30%) ───────────────────────────────────────────
  const boxStatusCounts = {
    'Not Started': 0,
    Packing: 0,
    Packed: 0,
    Loaded: 0,
    'In Transit': 0,
    Delivered: 0,
    Missing: 0
  };

  let totalBoxes = boxes.length;
  let packedBoxes = 0; // Ready for move or already moved
  let fragileBoxCount = 0;
  let priorityBoxCount = 0;

  boxes.forEach((b) => {
    if (boxStatusCounts[b.status] !== undefined) boxStatusCounts[b.status] += 1;
    if (['Packed', 'Loaded', 'In Transit', 'Delivered'].includes(b.status)) {
      packedBoxes += 1;
    }
    if (b.isFragile) fragileBoxCount += 1;
    if (b.isPriority) priorityBoxCount += 1;
  });

  let pillar2Score = 0;
  let pillar2Pct = 0;
  if (totalBoxes > 0) {
    pillar2Pct = Math.round((packedBoxes / totalBoxes) * 100);
    pillar2Score = (packedBoxes / totalBoxes) * 30;
  }

  // ── 3. Inventory & Pillar 3 (20%) ───────────────────────────────────────
  let totalItems = items.length;
  let packedItems = 0;
  let unpackedItems = 0;
  let fragileItemCount = 0;
  let totalEstimatedInventoryValue = 0;

  items.forEach((item) => {
    if (item.isPacked) packedItems += 1;
    else unpackedItems += 1;
    if (item.isFragile) fragileItemCount += 1;
    totalEstimatedInventoryValue += item.estimatedValue || 0;
  });

  let pillar3Score = 0;
  let pillar3Pct = 0;
  if (totalItems > 0) {
    pillar3Pct = Math.round((packedItems / totalItems) * 100);
    pillar3Score = (packedItems / totalItems) * 20;
  }

  // ── 4. Services & Pillar 4 (15%) ────────────────────────────────────────
  const serviceStatusCounts = {
    Inquired: 0,
    Booked: 0,
    Confirmed: 0,
    Completed: 0,
    Cancelled: 0
  };

  let totalBookings = bookings.length;
  let confirmedOrCompletedBookings = 0;

  bookings.forEach((bk) => {
    if (serviceStatusCounts[bk.status] !== undefined) serviceStatusCounts[bk.status] += 1;
    if (['Confirmed', 'Completed'].includes(bk.status)) {
      confirmedOrCompletedBookings += 1;
    }
  });

  let pillar4Score = 0;
  let pillar4Pct = 0;
  if (totalBookings > 0) {
    pillar4Pct = Math.round((confirmedOrCompletedBookings / totalBookings) * 100);
    pillar4Score = (confirmedOrCompletedBookings / totalBookings) * 15;
  }

  // ── Total Weighted Readiness Score (0 - 100) ───────────────────────────
  const rawScore = pillar1Score + pillar2Score + pillar3Score + pillar4Score;
  const readinessScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const readinessStatus =
    readinessScore >= 90
      ? 'Moving Ready'
      : readinessScore >= 70
      ? 'Almost Ready'
      : readinessScore >= 35
      ? 'In Progress'
      : 'Not Ready';

  // ── Financial Budget Summary ───────────────────────────────────────────
  let totalEstimatedCost = 0;
  let totalActualCost = 0;
  expenses.forEach((e) => {
    totalEstimatedCost += e.estimatedCost || 0;
    totalActualCost += e.actualCost || 0;
  });
  const budgetVariance = Math.round((totalActualCost - totalEstimatedCost) * 100) / 100;

  // ── Actionable Alerts ──────────────────────────────────────────────────
  const alerts = [];
  if (overdueTasks > 0) {
    alerts.push({
      type: 'warning',
      message: `${overdueTasks} task${overdueTasks > 1 ? 's are' : ' is'} overdue!`
    });
  }
  if (boxStatusCounts.Missing > 0) {
    alerts.push({
      type: 'danger',
      message: `${boxStatusCounts.Missing} box${boxStatusCounts.Missing > 1 ? 'es are' : ' is'} flagged as Missing!`
    });
  }
  if (budgetVariance > 0) {
    alerts.push({
      type: 'info',
      message: `Current moving expenses exceed estimate by $${budgetVariance}.`
    });
  }
  if (totalBoxes === 0 && totalItems > 0) {
    alerts.push({
      type: 'suggestion',
      message: `You have ${totalItems} items cataloged. Create boxes to start packing.`
    });
  }

  return {
    move: {
      _id: move._id,
      title: move.title,
      currentAddress: move.currentAddress,
      destinationAddress: move.destinationAddress,
      moveDate: move.moveDate,
      status: move.status
    },
    readinessScore,
    readinessStatus,
    pillarBreakdown: {
      essentialTasks: {
        weightPercentage: 35,
        scoreContribution: Math.round(pillar1Score * 10) / 10,
        progressPercentage: pillar1Pct,
        total: essentialTotal > 0 ? essentialTotal : totalTasks,
        completed: essentialTotal > 0 ? essentialCompleted : completedTasks
      },
      boxPacking: {
        weightPercentage: 30,
        scoreContribution: Math.round(pillar2Score * 10) / 10,
        progressPercentage: pillar2Pct,
        total: totalBoxes,
        packed: packedBoxes
      },
      inventoryPacking: {
        weightPercentage: 20,
        scoreContribution: Math.round(pillar3Score * 10) / 10,
        progressPercentage: pillar3Pct,
        total: totalItems,
        packed: packedItems
      },
      utilityServices: {
        weightPercentage: 15,
        scoreContribution: Math.round(pillar4Score * 10) / 10,
        progressPercentage: pillar4Pct,
        total: totalBookings,
        confirmedOrCompleted: confirmedOrCompletedBookings
      }
    },
    taskStats: {
      total: totalTasks,
      completed: completedTasks,
      pending: pendingTasks,
      overdue: overdueTasks,
      essentialTotal,
      essentialCompleted
    },
    boxStats: {
      total: totalBoxes,
      byStatus: boxStatusCounts,
      fragileCount: fragileBoxCount,
      priorityCount: priorityBoxCount
    },
    inventoryStats: {
      total: totalItems,
      packed: packedItems,
      unpacked: unpackedItems,
      fragileCount: fragileItemCount,
      totalEstimatedValue: Math.round(totalEstimatedInventoryValue * 100) / 100
    },
    budgetStats: {
      totalEstimatedCost: Math.round(totalEstimatedCost * 100) / 100,
      totalActualCost: Math.round(totalActualCost * 100) / 100,
      variance: budgetVariance,
      isOverBudget: budgetVariance > 0
    },
    serviceStats: {
      total: totalBookings,
      byStatus: serviceStatusCounts
    },
    alerts
  };
};

module.exports = {
  getMoveDashboard
};

