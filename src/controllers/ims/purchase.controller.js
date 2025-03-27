import { Item } from "../../models/item.model.js";
import { Purchase } from "../../models/ims/transaction.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { updateStock } from "../../utils/updateStock.js";
import { DocumentStorageService } from "../../utils/fileUploading.js";
import fs from 'fs/promises';
import path from 'path';
import { type } from "os";
import { formatDate, parsedData } from "../../utils/helper.js";

// create a new purchase entry
const createPurchase = asyncHandler(async (req, res) => {
    // console.log('create',req.body)

    const data = parsedData(req.body)

    // 1. Extract data from the request body
    let { name, invoiceNo, unitPrice, quantity, unit, clientVendor, biltyNumber, remarks } = data;

    // 3. fetched the item from the database
    const item = await Item.findOne({ name })

    // 4. return the error message if no item found
    if (!item) {
        return res.status(400).json({ message: 'No item found with this name' })
    }

    if (!remarks) {
        remarks = 'N/A'
    }

    // 5. Handle document uploads
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

    const taxableAmount = unitPrice * quantity
    const taxAmount = taxableAmount * item.gstRate / 100

    // 6. Create a new PurchaseEntry instance
    const newPurchaseEntry = new Purchase({
        itemId: item._id,
        createdBy: req.user._id || 'Unknown',
        invoiceNo,
        unitPrice,
        taxableAmount,
        taxAmount,
        totalAmount: taxableAmount + taxAmount,
        quantity,
        unit,
        clientVendor,
        biltyNumber,
        remarks,
        documents: savedDocuments.map(doc => ({
            originalName: doc.originalName,
            filename: doc.filename,
            path: doc.relativePath
        }))
    });

    // 7. Save the new purchase entry to the database
    const savedEntry = await newPurchaseEntry.save();
    await updateStock(savedEntry.itemId, quantity, 'increase');
    // 8. Prepare data to return to the frontend
    const responseData = {
        ...savedEntry.toObject(),  // Convert the saved entry to a plain object
        name,     // Add the item name to the response data
        createdBy: req.user.fullName // Send the user name along with the response
    };

    responseData.createdAt = formatDate(responseData.createdAt);
    responseData.updatedAt = formatDate(responseData.updatedAt);

    // 9. Send back the saved entry as a response
    res.status(200).json(new ApiResponse(200, responseData, 'Purchase entry created successfully!', 'Success'))
});

const getAllPurchases = asyncHandler(async (req, res) => {
    // console.log('get all purchases');
    const purchaseEntries = await Purchase.find()
        .sort({ createdAt: -1 })
        .populate('itemId', 'name')  // Populate only the 'name' field of the referenced Item
        .populate('createdBy', 'fullName')  // Populate only the fullName of the user
        .exec();

    console.log('purchaseEntries', purchaseEntries)

    // 2. If no items are found, return a 404 Not Found response
    if (!purchaseEntries || purchaseEntries.length === 0) {
        return res.status(404).json(
            new ApiResponse(404, {}, "No Purchase found", "Error")
        );
    }


    // 3. Convert createdAt and updatedAt fields into readable format for each item
    const responseData = purchaseEntries.map(entry => ({
        ...entry.toObject(),
        name: entry.itemId?.name || '-',   // Extract item name
        createdAt: formatDate(entry.createdAt),  // Format createdAt
        updatedAt: formatDate(entry.updatedAt),  // Format updatedAt
        createdBy: entry.createdBy ? entry.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
    }));

    // console.log('responseData',responseData)

    // Format the response to include the item name and other fields from PurchaseEntry
    // const formattedEntries = purchaseEntries.map(entry => ({
    //     _id: entry._id,
    //     name: entry.itemId?.name || '-',   // Extract item name
    //     invoiceNo: entry.invoiceNo,
    //     unitPrice: entry.unitPrice,
    //     taxableAmount: entry.taxableAmount,
    //     taxAmount: entry.taxAmount,
    //     totalAmount: entry.totalAmount,
    //     quantity: entry.quantity,
    //     unit: entry.unit,
    //     clientVendor: entry.clientVendor,
    //     biltyNumber: entry.biltyNumber,
    //     createdAt: new Date(entry.createdAt).toLocaleDateString(),
    //     updatedAt: new Date(entry.updatedAt).toLocaleDateString(),
    //     documents: entry.documents
    // }));
    // console.log('purchaseEntries', formattedEntries)
    res.status(200).json(new ApiResponse(200, responseData || [], 'Purchase entries fetched successfully!', 'Success'))
}
)

// delete an item from the database
const deletePurchase = asyncHandler(async (req, res) => {
    console.log('purchase')
    const { id } = req.params;  // Extract the purchase ID from the URL parameters
    // Check if the item exists in the database
    const purchaseEntry = await Purchase.findById(id);

    if (!purchaseEntry) {
        // If the item doesn't exist, return a 404 error
        return res.status(404).json({ message: 'No purchase found' });
    }

    // update the item stock 
    await updateStock(purchaseEntry.itemId, purchaseEntry.quantity, 'decrease')

    // 3. Remove associated files
    if (purchaseEntry.documents && purchaseEntry.documents.length > 0) {
        await Promise.all(
            purchaseEntry.documents.map(async (doc) => {
                try {
                    fs.unlink(path.join(process.cwd(), doc.path));
                } catch (unlinkError) {
                    console.warn(`Could not delete file: ${doc.path}`, unlinkError);
                }
            })
        );
    }

    console.log('yeess 2')
    // Delete the item from the database
    await Purchase.findByIdAndDelete(id);
    // Return a success response
    return res.status(200).json(
        new ApiResponse(200, { id }, "Deleted successfully", "Success")
    );

});


// ================================= edit an item in the databse ===============

// const updatePurchaseInfo = asyncHandler(async (req, res) => {

//     // 1. Get the purchase ID from the request params
//     const { id } = req.params;

//     // 2. Get the updated purchase entry data from the request body
//     const updatedData = req.body;

//     // 3. Find the item by ID to check the current values
//     const purchaseEntry = await Purchase.findById(id);

//     if (!purchaseEntry) {
//         return res.status(404).json({ message: 'Purchase not found' });
//     }

//     // 4. Check if any field has actually changed
//     const changes = {};
//     let hasChanges = false;

//     // 5. Compare current item fields with the updated fields and track changes
//     for (const key in updatedData) {
//         if (updatedData.hasOwnProperty(key) && updatedData[key] !== purchaseEntry[key]) {
//             changes[key] = updatedData[key];
//             hasChanges = true;
//         }
//     }
//     console.log('changes', changes)
//     // If no fields have changed, return a message
//     if (!hasChanges) {
//         return res.status(400).json({ message: 'No changes detected' });
//     }

//     // Update the item with the changes
//     const newUpdatedData = await Purchase.findByIdAndUpdate(id, changes, { new: true });
//     if (updatedData.increase) {
//         await updateStock(purchaseEntry.itemId, updatedData.quantity, 'increase')
//     } else if (updatedData.decrease) {
//         await updateStock(purchaseEntry.itemId, updatedData.quantity, 'decrease')
//     }

//     // Prepare data to return to the frontend
//     const responseData = {
//         ...newUpdatedData.toObject(),  // Convert the saved entry to a plain object
//         name: updatedData.name      // Add the item name to the response data
//     };
//     responseData.createdAt = new Date(responseData.createdAt).toLocaleDateString();
//     // Return the updated item
//     return res.status(200).json(
//         new ApiResponse(200, { responseData }, "Updated successfully", "Success")
//     );


// });

// // working
// const updatePurchaseInfo = asyncHandler(async (req, res) => {
//     console.log('update')
//     const { id } = req.params;
//     const updatedData = { ...req.body };
//     // // Check for file uploads
//     const uploadedFiles = req.files;
//     const removedDocuments = req.body.removedDocuments
//         ? JSON.parse(req.body.removedDocuments)
//         : [];

//     // console.log('updatedData', updatedData)
//     console.log('uploadedFiles', uploadedFiles)
//     console.log('removedDocuments', removedDocuments)
//     // // // Find the existing purchase entry
//     const purchaseEntry = await Purchase.findById(id);

//     if (!purchaseEntry) {
//         return res.status(404).json({ message: 'Purchase not found' });
//     }

//     // // Track changes
//     const changes = {};
//     let hasChanges = false;

//     // Compare and track field changes
//     for (const key in updatedData) {
//         if (Object.prototype.hasOwnProperty.call(updatedData, key) &&
//             updatedData[key] !== purchaseEntry[key]) {
//             changes[key] = updatedData[key];
//             hasChanges = true;
//         }
//     }

//     // // // Handle document removals
//     // // if (removedDocuments.length > 0) {
//     // //     purchaseEntry.documents = purchaseEntry.documents.filter(
//     // //         doc => !removedDocuments.includes(doc)
//     // //     );
//     // //     changes.documents = purchaseEntry.documents;
//     // //     hasChanges = true;
//     // // }

//     // // 3. Remove associated files
//     // if (removedDocuments.length > 0) {
//     //     await Promise.all(
//     //         removedDocuments.map(async (docPath) => {
//     //             try {
//     //                 fs.unlink(path.join(process.cwd(), docPath));
//     //             } catch (unlinkError) {
//     //                 console.warn(`Could not delete file: ${docPath}`, unlinkError);
//     //             }
//     //         })
//     //     );

//     //     purchaseEntry.documents = purchaseEntry.documents.filter(
//     //         doc => !removedDocuments.includes(doc.path)
//     //     );
//     //     changes.documents = purchaseEntry.documents;
//     //     hasChanges = true;
//     // }


//     // // Handle new document uploads
//     // // if (uploadedFiles && uploadedFiles.length > 0) {
//     // //     const newDocumentPaths = uploadedFiles.map(file => file.path);
//     // //     purchaseEntry.documents = [
//     // //         ...(purchaseEntry.documents || []),
//     // //         ...newDocumentPaths
//     // //     ];
//     // //     changes.documents = purchaseEntry.documents;
//     // //     hasChanges = true;
//     // // }




//     // // 5. Handle document uploads
//     // const documentStorageService = new DocumentStorageService('local');
//     // let savedDocuments = [];
//     // if (uploadedFiles && uploadedFiles.length > 0) {
//     //     try {
//     //         savedDocuments = await Promise.all(
//     //             uploadedFiles.map(file => documentStorageService.save(file))
//     //         );
//     //         purchaseEntry.documents = [
//     //             ...(purchaseEntry.documents || []),
//     //             ...savedDocuments
//     //         ];
//     //         changes.documents = purchaseEntry.documents;
//     //         hasChanges = true;

//     //     } catch (uploadError) {
//     //         return res.status(500).json({
//     //             message: 'Document upload failed',
//     //             error: uploadError.message
//     //         });
//     //     }
//     // }

//     // console.log('savedDocuments', savedDocuments)

//     // If no changes detected, return
//     if (!hasChanges) {
//         return res.status(400).json({ message: 'No changes detected' });
//     }

//     // // Update the purchase entry
//     const newUpdatedData = await Purchase.findByIdAndUpdate(
//         id,
//         changes,
//         { new: true }
//     );

//     // Handle stock updates if quantity changed
//     if (updatedData.increase) {
//         await updateStock(purchaseEntry.itemId, updatedData.quantity, 'increase');
//     } else if (updatedData.decrease) {
//         await updateStock(purchaseEntry.itemId, updatedData.quantity, 'decrease');
//     }

//     // Prepare response data
//     const responseData = {
//         ...newUpdatedData.toObject(),
//         name: updatedData.name
//     };
//     responseData.createdAt = new Date(responseData.createdAt).toLocaleDateString();

//     // return res.status(200).json({ message: 'done' });
//     return res.status(200).json(
//         new ApiResponse(200, { responseData }, "Updated successfully", "Success")
//     );
// });


// const updatePurchaseInfo = asyncHandler(async (req, res) => {
//     const { id } = req.params;

//     // Handle FormData or standard object input
//     const updatedData = req.body instanceof FormData 
//         ? Object.fromEntries(req.body.entries()) 
//         : req.body;

//     // Check for file uploads
//     const uploadedFiles = req.files || [];

//     // Parse removed documents
//     const removedDocuments = updatedData.removedDocuments 
//         ? (typeof updatedData.removedDocuments === 'string' 
//             ? JSON.parse(updatedData.removedDocuments) 
//             : updatedData.removedDocuments)
//         : [];

//     // Find the existing purchase entry
//     const purchaseEntry = await Purchase.findById(id);

//     if (!purchaseEntry) {
//         return res.status(404).json({ message: 'Purchase not found' });
//     }

//     // Document Storage Service

//     // Track changes
//     const changes = {};
//     let hasChanges = false;

//     // Compare and track field changes
//     for (const key in updatedData) {
//         // Skip special keys for document management
//         if (['removedDocuments'].includes(key)) continue;

//         if (updatedData[key] !== purchaseEntry[key]) {
//             changes[key] = updatedData[key];
//             hasChanges = true;
//         }
//     }


//     const documentStorageService = new DocumentStorageService('local');
//     // Handle document removals
//     if (removedDocuments.length > 0) {
//         // Remove files from filesystem
//         for (const docToRemove of removedDocuments) {
//             try {
//                 if (fs.existsSync(docToRemove)) {
//                     fs.unlinkSync(docToRemove);
//                 }
//             } catch (error) {
//                 console.error(`Error removing file ${docToRemove}:`, error);
//             }
//         }
//         console.log('check5')

//         // Update documents array in purchase entry
//         purchaseEntry.documents = purchaseEntry.documents.filter(
//             doc => !removedDocuments.includes(doc)
//         );
//         changes.documents = purchaseEntry.documents;
//         hasChanges = true;
//     }

//     // Handle new document uploads
//     let newSavedDocuments = [];
//     if (uploadedFiles && uploadedFiles.length > 0) {

//             try {
//                 newSavedDocuments = await Promise.all(
//                     uploadedFiles.map(file => documentStorageService.save(file))
//                 );
//             } catch (uploadError) {
//                 return res.status(500).json({
//                     message: 'Document upload failed',
//                     error: uploadError.message
//                 });
//             }

//             // try {
//             //     // Save file using DocumentStorageService
//             //     const savedFile = await documentStorageService.save(file);
//             //     newDocumentPaths.push(savedFile.relativePath);
//             // } catch (error) {
//             //     console.error('File upload error:', error);
//             //     return res.status(500).json({ 
//             //         message: 'Error uploading documents',
//             //         error: error.message 
//             //     });
//             // }


//         // Combine existing and new documents
//         purchaseEntry.documents = [
//             ...(purchaseEntry.documents || []),
//             ...newSavedDocuments
//         ];
//         changes.documents = purchaseEntry.documents;
//         hasChanges = true;
//     }

//     // If no changes detected, return
//     if (!hasChanges) {
//         return res.status(400).json({ message: 'No changes detected' });
//     }

//     // Update the purchase entry
//     const newUpdatedData = await Purchase.findByIdAndUpdate(
//         id, 
//         changes, 
//         { new: true }
//     );
//     console.log('check6')


//     // Handle stock updates if quantity changed
//     if (updatedData.increase) {
//         await updateStock(purchaseEntry.itemId, updatedData.quantity, 'increase');
//     } else if (updatedData.decrease) {
//         await updateStock(purchaseEntry.itemId, updatedData.quantity, 'decrease');
//     }

//     // Prepare response data
//     const responseData = {
//         ...newUpdatedData.toObject(),
//         name: updatedData.name
//     };
//     responseData.createdAt = new Date(responseData.createdAt).toLocaleDateString();

//     return res.status(200).json(
//         new ApiResponse(200, { responseData }, "Updated successfully", "Success")
//     );
// });



const updatePurchaseEntry = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = parsedData(req.body);
console.log('dataaaaaf',data)
    // Helper function to update amounts (taxable, tax, total)
    const updateAmounts = (entry, quantity, unitPrice, gstRate) => {
        const taxableAmount = quantity * unitPrice;
        const taxAmount = taxableAmount * gstRate / 100;
        const totalAmount = taxableAmount + taxAmount;

        entry.taxableAmount = taxableAmount;
        entry.taxAmount = taxAmount;
        entry.totalAmount = totalAmount;
    };


    // First fetch the sales entry
    const purchaseEntry = await Purchase.findById(id);
    if (!purchaseEntry) {
        return res.status(404).json({ message: 'No sale found' });
    }

    // Get the current item using itemId from purchaseEntry
    const currentItem = await Item.findById(purchaseEntry.itemId);
    if (!currentItem) {
        return res.status(404).json({ message: 'Current item not found' });
    }

    // Get the new item if name is different
    let newItem = null;
    if (data.name !== currentItem.name) {
        newItem = await Item.findOne({ name: data.name });
        if (!newItem) {
            return res.status(400).json({ message: 'No item found with this name' });
        }
    }

    let isUpdated = false;
    for (let key in data) {
        if (key === 'name') {
            if (currentItem.name !== data.name) {
                console.log('name one')
                // Update stock for old item (decrease)
                await updateStock(currentItem._id, purchaseEntry.quantity, 'decrease');

                // Update stock for new item (increase)
                await updateStock(newItem._id, purchaseEntry.quantity, 'increase');

                // Update the itemId in salesEntry
                purchaseEntry.itemId = newItem._id;
                isUpdated = true;
            }
        }
        else if (key === 'unitPrice') {
            if (purchaseEntry[key] !== data[key]) {
                console.log('unitprice')
                // const newTaxableAmount = purchaseEntry.quantity * data[key];
                // const newTaxAmount = newTaxableAmount * (newItem?.gstRate || currentItem.gstRate) / 100;
                // const newTotalAmount = newTaxableAmount + newTaxAmount;

                // purchaseEntry[key] = data[key];
                // purchaseEntry.taxableAmount = newTaxableAmount;
                // purchaseEntry.taxAmount = newTaxAmount;
                // purchaseEntry.totalAmount = newTotalAmount;
                // isUpdated = true;


                // Update amounts
                const gstRate = newItem?.gstRate || currentItem.gstRate;
                updateAmounts(purchaseEntry, purchaseEntry.quantity, data[key], gstRate);

                purchaseEntry[key] = data[key];
                isUpdated = true;
            }
        }
        else if (key === 'quantity') {
            if (purchaseEntry[key] !== data[key]) {
                console.log('quantity')
                let newQuantity;
                if (data[key] > purchaseEntry[key]) {
                    console.log('decrease')
                    newQuantity = data[key] - purchaseEntry[key];
                    await updateStock(newItem?._id || currentItem._id, newQuantity, 'increase');
                } else {
                    console.log('increase')
                    newQuantity = purchaseEntry[key] - data[key];
                    await updateStock(newItem?._id || currentItem._id, newQuantity, 'decrease');
                }


                // const newTaxableAmount = purchaseEntry.unitPrice * data[key];
                // const newTaxAmount = newTaxableAmount * (newItem?.gstRate || currentItem.gstRate) / 100;
                // const newTotalAmount = newTaxableAmount + newTaxAmount;

                // purchaseEntry.taxableAmount = newTaxableAmount;
                // purchaseEntry.taxAmount = newTaxAmount;
                // purchaseEntry.totalAmount = newTotalAmount;
                // purchaseEntry[key] = data[key];
                // isUpdated = true;

                // Update amounts based on new quantity
                const gstRate = newItem?.gstRate || currentItem.gstRate;
                updateAmounts(purchaseEntry, data[key], purchaseEntry.unitPrice, gstRate);

                purchaseEntry[key] = data[key];
                isUpdated = true;
            }
        }
        else if (purchaseEntry[key] !== undefined && data[key] !== purchaseEntry[key]) {
            console.log('other one')
            purchaseEntry[key] = data[key];
            isUpdated = true;
        }
    }

    if (isUpdated) {
        console.log('triggered')
        await purchaseEntry.save();
    }

    // Prepare response data - include the item name in the response
    const responseData = {
        ...purchaseEntry.toObject(),
        name: newItem?.name || currentItem.name
    };
    responseData.createdAt = new Date(responseData.createdAt).toLocaleDateString();

    return res.status(200).json(
        new ApiResponse(200, responseData, isUpdated ? "Updated successfully" : "No changes detected!", "Success")
    );
});

export {
    createPurchase,
    getAllPurchases,
    deletePurchase,
    updatePurchaseEntry
}
