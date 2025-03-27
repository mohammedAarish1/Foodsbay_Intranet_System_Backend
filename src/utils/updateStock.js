import { Item } from "../models/item.model.js";

// const updateStock = async (itemId, quantity) => {
//     try {
//       // Find the item by its ID
//       const item = await Item.findById(itemId);
  
//       if (!item) {
//         throw new Error('Item not found');
//       }
  
//       // Update stock quantity
//       item.stockInHand += quantity;
  
//       // If the stock is now 0 or less, update the status to 'Out of Stock'
//       if (item.stockInHand <= 0) {
//         item.status = 'Out of Stock';
//         item.stockInHand = 0;  // Ensure stock doesn't go below zero
//       } else {
//         // If stock is positive, update the status to 'In Stock'
//         if (item.status === 'Out of Stock') {
//           item.status = 'In Stock';
//         }
//       }
  
//       // Save the item with the updated stock and status
//       await item.save();
  
//       return item;  // Return the updated item object for further use if needed
//     } catch (error) {
//       throw new Error(`Error updating stock: ${error.message}`);
//     }
//   };
  
//  export {updateStock};
  

const updateStock = async (itemId, quantity, action) => {
  try {
    console.log('yes')
    // Find the item by its ID
    const item = await Item.findById(itemId);

    if (!item) {
      throw new Error('Item not found');
    }

    // Determine if we are increasing or decreasing the stock
    if (action === 'increase') {
      item.stockInHand += quantity;  // Increase stock by the specified quantity
    } else if (action === 'decrease') {
      item.stockInHand -= quantity;  // Decrease stock by the specified quantity
    } else {
      throw new Error('Invalid action. Please specify "increase" or "decrease".');
    }

    // Ensure stock doesn't go below zero
    if (item.stockInHand < 0) {
      item.stockInHand = 0;
    }

    // If the stock is now 0 or less, update the status to 'Out of Stock'
    if (item.stockInHand === 0) {
      item.status = 'Out of Stock';
    } else {
      // If stock is positive, update the status to 'In Stock'
      if (item.status === 'Out of Stock') {
        item.status = 'In Stock';
      }
    }

    console.log('stockin hand', item.stockInHand)
    // Save the item with the updated stock and status
    await item.save();

    return item;  // Return the updated item object for further use if needed
  } catch (error) {
    throw new Error(`Error updating stock: ${error.message}`);
  }
};


 export {updateStock};
