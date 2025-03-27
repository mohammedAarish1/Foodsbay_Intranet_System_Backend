import { DefectiveProduct } from "../../models/ims/defectiveProduct.model.js";
import { SalesReturn } from "../../models/ims/transactionReturn.model.js";
import { Item } from "../../models/item.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { DocumentStorageService } from "../../utils/fileUploading.js";
import { updateStock } from "../../utils/updateStock.js";
import { formatDate, parsedData } from "../../utils/helper.js";
import { Sales } from "../../models/ims/transaction.model.js";


const createNewSalesReturn = asyncHandler(async (req, res) => {
    // 1. Dynamically parse all expected numeric fields
    const data = parsedData(req.body);

    // 2. destructure the data 
    let { name, invoiceNo, unitPrice, quantity, unit, clientVendor, creditNoteNo, condition, remarks } = data;

    // 3. fetched the item from the database
    const item = await Item.findOne({ name });

    // // 4. return the error message if no item found
    if (!item) {
        return res.status(400).json({ message: 'No item found with this name' })
    }

    const salesEntry = await Sales.findOne({ invoiceNo, itemId: item._id })
    console.log('salesentry', salesEntry)
    if (!salesEntry) {
        return res.status(400).json({ message: 'Invalid invoice no. or item name.' })
    }

const existingSaleReturnEntry=await SalesReturn.findOne({invoiceNo,item:item._id})
if(existingSaleReturnEntry){
    if(existingSaleReturnEntry.quantity===quantity){
        return res.status(400).json({ message: 'All Quantities are already returned.' })
    }
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


    if (!data.remarks) {
        data.remarks = 'N/A'
    }

    const taxableAmount = unitPrice * quantity;
    const taxAmount = taxableAmount * item.gstRate / 100
    const totalAmount = taxableAmount + taxAmount


    // 6. Create a new PurchaseEntry instance
    const newSalesReturnEntry = new SalesReturn({
        itemId: item._id,
        invoiceNo,
        unitPrice,
        taxableAmount,
        taxAmount,
        totalAmount,
        quantity,
        unit,
        clientVendor,
        creditNoteNo,
        condition,
        remarks,
        documents: savedDocuments?.map(doc => ({
            originalName: doc.originalName,
            filename: doc.filename,
            path: doc.relativePath
        })),
        createdBy: req.user?._id || 'Unknown'
    });

    // 7. Save the new purchase entry to the database
    const salesReturnEntry = await newSalesReturnEntry.save();

    if (salesReturnEntry.condition !== 'Perfect') {
        const newDefectiveProductEntry = new DefectiveProduct({
            itemId: item._id,
            salesReturnId: salesReturnEntry._id,
            amount:totalAmount,
            quantity,
            unit,
            condition,
        });

        const newDefectiveProduct = await newDefectiveProductEntry.save();
    } else {
        await updateStock(salesReturnEntry.itemId, quantity, 'increase');
        console.log('done updating')
    }


    const responseData = {
        ...salesReturnEntry.toObject(),
        name,
        createdBy: req.user.fullName // Send the user name along with the response
    };

    responseData.createdAt = formatDate(responseData.createdAt);
    responseData.updatedAt = formatDate(responseData.updatedAt);
console.log('responseData',responseData)
    // // 9. Send back the saved entry as a response
    res.status(200).json(new ApiResponse(200, responseData, 'Purchase entry created successfully!', 'Success'))
});


const getAllSalesReturn = asyncHandler(async (req, res) => {
    console.log('get all sales return');
    const salesReturnEntries = await SalesReturn.find()
        .sort({ createdAt: -1 })
        .populate('itemId', 'name')  // Populate only the 'name' field of the referenced Item
        .populate('createdBy', 'fullName')  // Populate only the fullName of the user
        .exec();

        if (!salesReturnEntries || salesReturnEntries.length === 0) {
            return res.status(404).json(
                new ApiResponse(404, {}, "No Purchase found", "Error")
            );
        }
    
    
    // Format the response to include the item name and other fields from PurchaseEntry
        const responseData = salesReturnEntries.map(entry => ({
            ...entry.toObject(),
            name: entry.itemId?.name || '-',   // Extract item name
            createdAt: formatDate(entry.createdAt),  // Format createdAt
            updatedAt: formatDate(entry.updatedAt),  // Format updatedAt
            createdBy: entry.createdBy ? entry.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
        }));



    // Format the response to include the item name and other fields from PurchaseEntry
    // const formattedEntries = salesReturnEntries.map(entry => ({
    //     _id: entry._id,
    //     name: entry.itemId?.name || 'Unknown item',   // Extract item name
    //     invoiceNo: entry.invoiceNo,
    //     unitPrice: entry.unitPrice,
    //     taxableAmount: entry.taxableAmount,
    //     taxAmount: entry.taxAmount,
    //     totalAmount: entry.totalAmount,
    //     quantity: entry.quantity,
    //     unit: entry.unit,
    //     clientVendor: entry.clientVendor,
    //     creditNoteNo: entry.creditNoteNo,
    //     condition: entry.condition,
    //     createdAt: new Date(entry.createdAt).toLocaleDateString(),
    //     updatedAt: new Date(entry.updatedAt).toLocaleDateString(),
    //     remarks: entry.remarks || ''
    //     // documents: entry.documents
    // }));
    // console.log('purchaseEntries', formattedEntries)
    res.status(200).json(new ApiResponse(200, responseData || [], 'Sales return entries fetched successfully!', 'Success'))


    // return purchaseEntries;
}
)



const deleteSalesReturn = asyncHandler(async (req, res) => {
    console.log('sales return')
    const { id } = req.params;  // Extract the purchase ID from the URL parameters
    // Check if the item exists in the database
    const salesReturnEntry = await SalesReturn.findById(id);

    if (!salesReturnEntry) {
        // If the item doesn't exist, return a 404 error
        return res.status(404).json({ message: 'No Sales return found with the given ID' });
    }

    // update the item stock 
    // await updateStock(purchaseEntry.itemId, purchaseEntry.quantity, 'decrease')

    // 3. Remove associated files
    if (salesReturnEntry.documents && salesReturnEntry.documents.length > 0) {
        await Promise.all(
            salesReturnEntry.documents.map(async (doc) => {
                try {
                    fs.unlink(path.join(process.cwd(), doc.path));
                } catch (unlinkError) {
                    console.warn(`Could not delete file: ${doc.path}`, unlinkError);
                }
            })
        );
    }

    // update the item stock 
    await updateStock(salesReturnEntry.itemId, salesReturnEntry.quantity, 'decrease')

    // Delete the item from the database
    await SalesReturn.findByIdAndDelete(id);
    // Return a success response
    return res.status(200).json(
        new ApiResponse(200, { id }, "Deleted successfully", "Success")
    );

});

export {
    createNewSalesReturn,
    getAllSalesReturn,
    deleteSalesReturn
}