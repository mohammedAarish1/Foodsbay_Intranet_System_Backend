import { Purchase } from "../../models/ims/transaction.model.js";
import { PurchaseReturn } from "../../models/ims/transactionReturn.model.js";
import { Item } from "../../models/item.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { DocumentStorageService } from "../../utils/fileUploading.js";
import { formatDate, parsedData } from "../../utils/helper.js";
import { updateStock } from "../../utils/updateStock.js";

const createNewPurchaseReturn = asyncHandler(async (req, res) => {
    // 1. Dynamically parse all expected numeric fields
    const data = parsedData(req.body);

    // 2. destructure the data 
    let { name, invoiceNo, unitPrice, quantity, unit, clientVendor, debitNoteNo,  remarks } = data;

    // 3. fetched the item from the database
    const item = await Item.findOne({ name });

    // // 4. return the error message if no item found
    if (!item) {
        return res.status(400).json({ message: 'No item found with this name' })
    }

    const purchaseEntry=await Purchase.findOne({invoiceNo,itemId:item._id})
    console.log('purchaseEntry', purchaseEntry)
    if(!purchaseEntry){
        return res.status(400).json({message:'Invalid invoice no. or item name.'})
    }
   

    // // 5. Handle document uploads
    const documentStorageService = new DocumentStorageService('local');
    let savedDocuments = [];
    if (req.files && req.files.length > 0) {
        try {
            savedDocuments = await Promise.all(
                req.files.map(file => documentStorageService.save(file))
            );
        } catch (uploadError) {
            return res.status(500).json({
                message: 'Document upload failed',
                error: uploadError.message
            });
        }
    }


    if(!data.remarks){
        data.remarks='N/A'
    }

    const taxableAmount = unitPrice * quantity;
    const taxAmount = taxableAmount * item.gstRate / 100


    // 6. Create a new PurchaseEntry instance
    const newPurchaseReturnEntry = new PurchaseReturn({
        itemId: item._id,
        invoiceNo,
        unitPrice,
        taxableAmount,
        taxAmount,
        totalAmount: taxableAmount + taxAmount,
        quantity,
        unit,
        clientVendor,
        debitNoteNo,
        remarks,  
        documents: savedDocuments?.map(doc => ({
            originalName: doc.originalName,
            filename: doc.filename,
            path: doc.relativePath
        })),
        createdBy:req.user?._id || 'Unknown'
    });

    // 7. Save the new purchase entry to the database
    const purchaseReturnEntry = await newPurchaseReturnEntry.save();

    // if (purchaseReturnEntry.condition !== 'Perfect') {
    //     const newDefectiveProductEntry = new DefectiveProduct({
    //         itemId: item._id,
    //         salesReturnId: salesReturnEntry._id,
    //         amount,
    //         quantity,
    //         unit,
    //         condition,
    //     });

    //     const newDefectiveProduct = await newDefectiveProductEntry.save();
    // } else {
    //     await updateStock(salesReturnEntry.itemId, quantity, 'increase');
    //     console.log('done updating')
    // }
    
        await updateStock(purchaseReturnEntry.itemId, quantity, 'decrease');

    const responseData = {
        ...purchaseReturnEntry.toObject(),
        name,
        createdBy: req.user.fullName // Send the user name along with the response
      };
    
      responseData.createdAt= formatDate(responseData.createdAt);
      responseData.updatedAt= formatDate(responseData.updatedAt);
  
    // // 9. Send back the saved entry as a response
    res.status(200).json(new ApiResponse(200, responseData, 'Purchase entry created successfully!', 'Success'))
})



const getAllPurchaseReturn = asyncHandler(async (req, res) => {
    console.log('get all sales return');
    const purchaseReturnEntries = await PurchaseReturn.find()
        .sort({ createdAt: -1 })
        .populate('itemId', 'name')  // Populate only the 'name' field of the referenced Item
        .populate('createdBy', 'fullName')  // Populate only the fullName of the user
        .exec();

        if (!purchaseReturnEntries || purchaseReturnEntries.length === 0) {
            return res.status(404).json(
                new ApiResponse(404, {}, "No Purchase found", "Error")
            );
        }
    
    
    // Format the response to include the item name and other fields from PurchaseEntry
        const responseData = purchaseReturnEntries.map(entry => ({
            ...entry.toObject(),
            name: entry.itemId?.name || '-',   // Extract item name
            createdAt: formatDate(entry.createdAt),  // Format createdAt
            updatedAt: formatDate(entry.updatedAt),  // Format updatedAt
            createdBy: entry.createdBy ? entry.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
        }));

    
    res.status(200).json(new ApiResponse(200, responseData || [] , 'Purchase return entries fetched successfully!', 'Success'))
}
);

const deletePurchaseReturn = asyncHandler(async (req, res) => {
    console.log('sales return')
    const { id } = req.params;  // Extract the purchase ID from the URL parameters
    // Check if the item exists in the database
    const purchaseReturnEntry = await PurchaseReturn.findById(id);

    if (!purchaseReturnEntry) {
        // If the item doesn't exist, return a 404 error
        return res.status(404).json({ message: 'No Sales return found with the given ID' });
    }

    // update the item stock 
    // await updateStock(purchaseEntry.itemId, purchaseEntry.quantity, 'decrease')

    // 3. Remove associated files
    if (purchaseReturnEntry.documents && purchaseReturnEntry.documents.length > 0) {
        await Promise.all(
            purchaseReturnEntry.documents.map(async (doc) => {
                try {
                    fs.unlink(path.join(process.cwd(), doc.path));
                } catch (unlinkError) {
                    console.warn(`Could not delete file: ${doc.path}`, unlinkError);
                }
            })
        );
    }

      // update the item stock 
      await updateStock(purchaseReturnEntry.itemId, purchaseReturnEntry.quantity, 'increase')

    // Delete the item from the database
    await PurchaseReturn.findByIdAndDelete(id);
    // Return a success response
    return res.status(200).json(
        new ApiResponse(200, { id }, "Deleted successfully", "Success")
    );

});


const updatePurchaseReturnEntry = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = parsedData(req.body);
console.log('data', data)
    // // First fetch the sales entry
    // const salesEntry = await Sales.findById(id);
    // if (!salesEntry) {
    //     return res.status(404).json({ message: 'No sale found' });
    // }

    // // Get the current item using itemId from salesEntry
    // const currentItem = await Item.findById(salesEntry.itemId);
    // if (!currentItem) {
    //     return res.status(404).json({ message: 'Current item not found' });
    // }

    // // Get the new item if name is different
    // let newItem = null;
    // if (data.name !== currentItem.name) {
    //     newItem = await Item.findOne({ name: data.name });
    //     if (!newItem) {
    //         return res.status(400).json({ message: 'No item found with this name' });
    //     }
    // }

    // let isUpdated = false;
    // for (let key in data) {
    //     if (key === 'name') {
    //         if (currentItem.name !== data.name) {
    //             console.log('name one')
    //             // Update stock for old item (increase)
    //             await updateRawMaterials(currentItem.name, salesEntry.quantity, 'increase');
                
    //             // Update stock for new item (decrease)
    //             await updateRawMaterials(data.name, salesEntry.quantity, 'decrease');
                
    //             // Update the itemId in salesEntry
    //             salesEntry.itemId = newItem._id;
    //             isUpdated = true;
    //         }
    //     }
    //     else if (key === 'unitPrice') {
    //         if (salesEntry[key] !== data[key]) {
    //             console.log('unitprice')
    //             const newTaxableAmount = salesEntry.quantity * data[key];
    //             const newTaxAmount = newTaxableAmount * (newItem?.gstRate || currentItem.gstRate) / 100;
    //             const newTotalAmount = newTaxableAmount + newTaxAmount;

    //             salesEntry[key] = data[key];
    //             salesEntry.taxableAmount = newTaxableAmount;
    //             salesEntry.taxAmount = newTaxAmount;
    //             salesEntry.totalAmount = newTotalAmount;
    //             isUpdated = true;
    //         }
    //     }
    //     else if (key === 'quantity') {
    //         if (salesEntry[key] !== data[key]) {
    //             console.log('quantity')
    //             let newQuantity;
    //             if (data[key] > salesEntry[key]) {
    //                 console.log('decrease')
    //                 newQuantity = data[key] - salesEntry[key];
    //                 await updateRawMaterials(newItem?.name || currentItem.name, newQuantity, 'decrease');
    //             } else {
    //                 console.log('increase')
    //                 newQuantity = salesEntry[key] - data[key];
    //                 await updateRawMaterials(newItem?.name || currentItem.name, newQuantity, 'increase');
    //             }
                
    //             const newTaxableAmount = salesEntry.unitPrice * data[key];
    //             const newTaxAmount = newTaxableAmount * (newItem?.gstRate || currentItem.gstRate) / 100;
    //             const newTotalAmount = newTaxableAmount + newTaxAmount;

    //             salesEntry.taxableAmount = newTaxableAmount;
    //             salesEntry.taxAmount = newTaxAmount;
    //             salesEntry.totalAmount = newTotalAmount;

    //             salesEntry[key] = data[key];
    //             isUpdated = true;
    //         }
    //     }
    //     else if (salesEntry[key] !== undefined && data[key] !== salesEntry[key]) {
    //         console.log('other one')
    //         salesEntry[key] = data[key];
    //         isUpdated = true;
    //     }
    // }

    // if (isUpdated) {
    //     console.log('triggered')
    //     await salesEntry.save();
    // }

    // // Prepare response data - include the item name in the response
    // const responseData = {
    //     ...salesEntry.toObject(),
    //     name: newItem?.name || currentItem.name
    // };
    // responseData.createdAt = new Date(responseData.createdAt).toLocaleDateString();

    // return res.status(200).json(
    //     new ApiResponse(200, responseData, isUpdated ? "Updated successfully" : "No changes detected!", "Success")
    // );
});

export {
    createNewPurchaseReturn,
    getAllPurchaseReturn,
    deletePurchaseReturn,
    updatePurchaseReturnEntry
}