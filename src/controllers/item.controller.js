import mongoose from 'mongoose';
import { Item } from '../models/item.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { formatDate } from '../utils/helper.js';
import { Purchase, Sales } from '../models/ims/transaction.model.js';
import { PurchaseReturn, SalesReturn } from '../models/ims/transactionReturn.model.js';


// ======================================== Create a new item =============================================
const createItem = asyncHandler(async (req, res) => {
  // 1. store the data from the request body
  const itemData = req.body;
console.log('itemdata', req.body)
  // 2. If hsnDesc is not provided, set it to 'N/A'
  if (!itemData.hsnDesc) {
    itemData.hsnDesc = 'N/A';
  }
  // 3. check if any item with same name already exists
  const existingItem = await Item.findOne({ name: itemData.name });

  // 4. return the error message if the item already exists
  if (existingItem) {
    throw new ApiError(409, 'Item with same name already exists')
  }

  // 5. store the user ID to the item data (from the authenticated user)
  itemData.createdBy = req.user._id || 'Unknown'

  // 5. Create a new item using the Item model
  const item = new Item(itemData);

  // 6. Save item to the database 
  await item.save();

  // Convert the dates into a readable format
  const responseData = {
    ...item.toObject(),
    createdBy: req.user.fullName // Send the user name along with the response
  };

  responseData.createdAt = formatDate(responseData.createdAt);
  responseData.updatedAt = formatDate(responseData.updatedAt);

  // 7. Return the created item with response
  return res.status(201).json(
    new ApiResponse(200, responseData, "Item created successfully", "Success")
  )
})

// ======================================== get item list =============================================
const getAllItems = asyncHandler(async (req, res) => {

  // 1. Fetch items sorted in descending order by a field, e.g., by "createdAt"
  const itemList = await Item.find()
    .sort({ createdAt: -1 })
    .populate('createdBy', 'fullName')  // Populate only the fullName of the user

  // 2. If no items are found, return a 404 Not Found response
  if (!itemList || itemList.length === 0) {
    return res.status(404).json(
      new ApiResponse(404, {}, "No items found", "Error")
    );
  }

  console.log('itemList');

  // 3. Convert createdAt and updatedAt fields into readable format for each item
  const formattedItemList = itemList.map(item => ({
    ...item.toObject(),
    createdAt: formatDate(item.createdAt),  // Format createdAt
    updatedAt: formatDate(item.updatedAt),  // Format updatedAt
    createdBy: item.createdBy ? item.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
  }));

  // 3. Return the success response with the item list
  return res.status(200).json(
    new ApiResponse(200, formattedItemList || [], "Item list fetched successfully", "Success")
  );
})


// =========================   delete an item from the database =====================================
const deleteItem = asyncHandler(async (req, res) => {

  // 1. Extract the item ID from the URL parameters
  const { id } = req.params;

  // 2. Check if the item exists in the database
  const item = await Item.findById(id);

  // 3. If the item doesn't exist, return a 404 error
  if (!item) {
    return res.status(404).json({ message: 'No item found' });
  }

  // 4. Delete the item from the database
  await Item.findByIdAndDelete(id);

  // 5. Return a success response
  return res.status(200).json(
    new ApiResponse(200, { id }, "Item deleted successfully", "Success")
  );

});

// ================================= edit the item in the databse ======================================
const updateItemInfo = asyncHandler(async (req, res) => {
  console.log('checked')

  // 1. Get the item ID from the request params
  const { id } = req.params;

  // 2. Get the updated item data from the request body
  const updatedData = req.body;

  // 3. Find the item by ID to check the current values
  let item = await Item.findById(id);

  // 4. If the item doesn't exist, return a 404 error
  if (!item) {
    return res.status(404).json({ message: 'Item not found' });
  }

  // 5. if name updated, check if the item with same name already exists and return error
  if (item.name !== updatedData.name) {
    const existingItem = await Item.findOne({ name: updatedData.name });
    if (existingItem) {
      return res.status(404).json({ message: 'Item with same name already exists' });

    }
  }

  // 6. define the variables to track the changes
  const changes = {};
  let hasChanges = false;

  // 7. Compare current item fields with the updated fields and track changes
  for (const key in updatedData) {
    if (updatedData.hasOwnProperty(key) && updatedData[key] !== item[key] && item[key] !== undefined) {
      changes[key] = updatedData[key];
      hasChanges = true;
    }
  }
  // 8. Update the item with the changes
  if (hasChanges) {
    item = await Item.findByIdAndUpdate(id, changes, { new: true });
  }

  // 9. Return the updated item
  return res.status(200).json(
    new ApiResponse(200, item, hasChanges ? "Item updated successfully" : 'No changes detected', "Success")
  );


});

// =============================== get the name of the all the items =================
// const getItemNames = asyncHandler(async (req, res) => {
//     // Query the database to fetch only the `name` field from all items
//     const items = await Item.find({}, 'name'); // `{}` means all documents, 'name' selects only the name field
//     // Map the results to return an array of names
//     const itemNames = items.map(item => item.name);

//     // Send the result back to the client
//     res.status(200).json(new ApiResponse(200,itemNames,"Item name fetched successfully", 'Success'));

// })

const getItemHistory = asyncHandler(async (req, res) => {
  console.log('yesssssssssssssssssss')
    const { itemId } = req.params;
    // const objectId = new mongoose.Types.ObjectId(itemId);

    // Get the item details
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Fetch all transactions for this item
    const [purchases, sales, purchaseReturns, salesReturns] = await Promise.all([
      Purchase.find({ itemId: itemId })
        .select('invoiceNo quantity unitPrice taxableAmount taxAmount totalAmount unit clientVendor biltyNumber remarks createdAt')
        .lean(),
      Sales.find({ itemId: itemId })
        .select('invoiceNo quantity unitPrice taxableAmount taxAmount totalAmount unit clientVendor biltyNumber remarks createdAt')
        .lean(),
      PurchaseReturn.find({ itemId: itemId })
        .select('invoiceNo quantity unitPrice taxableAmount taxAmount totalAmount unit clientVendor debitNoteNo remarks createdAt')
        .lean(),
      SalesReturn.find({ itemId: itemId })
        .select('invoiceNo quantity unitPrice taxableAmount taxAmount totalAmount unit clientVendor creditNoteNo condition remarks createdAt')
        .lean()
    ]);

    // Transform and combine all transactions
    const transformedTransactions = [
      ...purchases.map(p => ({
        date: p.createdAt,
        type: 'purchase',
        documentNo: p.invoiceNo,
        referenceNo: p.biltyNumber || 'N/A',
        party: p.clientVendor,
        quantity: p.quantity,
        unit: p.unit,
        rate: p.unitPrice,
        taxableAmount: p.taxableAmount,
        taxAmount: p.taxAmount,
        totalAmount: p.totalAmount,
        remarks: p.remarks || 'N/A'
      })),
      ...sales.map(s => ({
        date: s.createdAt,
        type: 'sale',
        documentNo: s.invoiceNo,
        referenceNo: s.biltyNumber || 'N/A',
        party: s.clientVendor,
        quantity: -s.quantity, // negative for sales
        unit: s.unit,
        rate: s.unitPrice,
        taxableAmount: s.taxableAmount,
        taxAmount: s.taxAmount,
        totalAmount: s.totalAmount,
        remarks: s.remarks || 'N/A'
      })),
      ...purchaseReturns.map(pr => ({
        date: pr.createdAt,
        type: 'purchaseReturn',
        documentNo: pr.invoiceNo,
        referenceNo: pr.debitNoteNo || 'N/A',
        party: pr.clientVendor,
        quantity: -pr.quantity, // negative for returns
        unit: pr.unit,
        rate: pr.unitPrice,
        taxableAmount: pr.taxableAmount,
        taxAmount: pr.taxAmount,
        totalAmount: pr.totalAmount,
        remarks: pr.remarks || 'N/A'
      })),
      ...salesReturns.map(sr => ({
        date: sr.createdAt,
        type: 'saleReturn',
        documentNo: sr.invoiceNo,
        referenceNo: sr.creditNoteNo || 'N/A',
        party: sr.clientVendor,
        quantity: sr.quantity,
        unit: sr.unit,
        rate: sr.unitPrice,
        taxableAmount: sr.taxableAmount,
        taxAmount: sr.taxAmount,
        totalAmount: sr.totalAmount,
        remarks: `${sr.condition ? 'Condition: ' + sr.condition + '. ' : ''}${sr.remarks || 'N/A'}`
      }))
    ];

    // Sort transactions by date in ascending order
    const sortedTransactions = transformedTransactions.sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    // Calculate running balance for each transaction
    let runningBalance = item.stockInHand || 0;
    const transactionsWithBalance = sortedTransactions.map(transaction => {
      runningBalance += transaction.quantity;
      return {
        ...transaction,
        balance: runningBalance
      };
    });

    // Prepare summary statistics
    const summary = {
      totalPurchaseQty: purchases.reduce((sum, p) => sum + p.quantity, 0),
      totalSaleQty: sales.reduce((sum, s) => sum + s.quantity, 0),
      totalPurchaseReturnQty: purchaseReturns.reduce((sum, pr) => sum + pr.quantity, 0),
      totalSaleReturnQty: salesReturns.reduce((sum, sr) => sum + sr.quantity, 0),
      totalPurchaseAmount: purchases.reduce((sum, p) => sum + p.totalAmount, 0),
      totalSaleAmount: sales.reduce((sum, s) => sum + s.totalAmount, 0),
      totalPurchaseReturnAmount: purchaseReturns.reduce((sum, pr) => sum + pr.totalAmount, 0),
      totalSaleReturnAmount: salesReturns.reduce((sum, sr) => sum + sr.totalAmount, 0)
    };

    res.json({
      itemDetails: {
        name: item.name,
        category: item.category,
        inventoryType: item.inventoryType,
        unit: item.unit,
        currentStock: item.stockInHand,
        minStock: item.minStock,
        status: item.status
      },
      summary,
      transactions: transactionsWithBalance
    });

 
})

export {
  createItem,
  getAllItems,
  deleteItem,
  updateItemInfo,
  getItemHistory
  // getItemNames
}

