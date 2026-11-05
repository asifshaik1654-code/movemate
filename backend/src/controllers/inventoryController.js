const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/apiResponse');
const inventoryService = require('../services/inventoryService');

const createItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.createItem(req.params.roomId, req.user._id, req.body);
  return new ApiResponse(201, 'Inventory item added successfully', item).send(res);
});

const getItems = asyncHandler(async (req, res) => {
  const result = await inventoryService.getRoomItems(req.params.roomId, req.query);
  return new ApiResponse(200, 'Inventory items retrieved successfully', result).send(res);
});

const getItem = asyncHandler(async (req, res) => {
  const item = await inventoryService.getItemById(req.params.itemId);
  return new ApiResponse(200, 'Item details retrieved', item).send(res);
});

const updateItem = asyncHandler(async (req, res) => {
  const updated = await inventoryService.updateItem(req.params.itemId, req.user._id, req.body);
  return new ApiResponse(200, 'Item updated successfully', updated).send(res);
});

const deleteItem = asyncHandler(async (req, res) => {
  const result = await inventoryService.deleteItem(req.params.itemId, req.user._id);
  return new ApiResponse(200, 'Item deleted successfully', result).send(res);
});

module.exports = { createItem, getItems, getItem, updateItem, deleteItem };

