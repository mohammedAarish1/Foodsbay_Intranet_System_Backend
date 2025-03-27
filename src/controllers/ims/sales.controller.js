import { Sales } from "../../models/ims/transaction.model.js";
import { Item } from "../../models/item.model.js";
import { BOM } from "../../models/bom.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js"
import { asyncHandler } from "../../utils/asyncHandler.js"
import { DocumentStorageService } from "../../utils/fileUploading.js";
import { updateStock } from "../../utils/updateStock.js";
import { formatDate, parsedData } from "../../utils/helper.js";

// utility furnction to update the raw material after each sale
const updateRawMaterials = async (name, quantity, action) => {
    // console.log('name', name)
    const bomEntry = await BOM.findOne({ name });
    // console.log('bomEntry', bomEntry.rawMaterial)
    if (!bomEntry) {
        return 'No BOM entry found with this name'
        // return res.status(400).json({ message: 'No BOM entry found with this name' })
    }
    for (let { rm, quantity: rmQuantity } of bomEntry.rawMaterial) {
        const totalQuantity = quantity * rmQuantity
        // console.log('totalQuantity', totalQuantity)
        await updateStock(rm, totalQuantity, action)
    }

}



const createSale = asyncHandler(async (req, res) => {

    // 1. parse the form data 
    const data = parsedData(req.body);

    // 2. destructure the data 
    let { name, invoiceNo, unitPrice, quantity, unit, clientVendor, biltyNumber, remarks } = data;

    console.log('unitPrice', unitPrice)
    // const invoice = await Sales.findOne({ invoiceNo })
    // if(invoice){
    //     return res.status(401).json({message: 'Invoice number already exists'})
    // }

    // 3. fetched the item from the database
    const item = await Item.findOne({ name })

    // // 4. return the error message if no item found
    if (!item) {
        return res.status(400).json({ message: 'No item found with this name' })
    }

    if (!remarks) {
        remarks = 'N/A'
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

    const taxableAmount = unitPrice * quantity;
    const taxAmount = taxableAmount * item.gstRate / 100

    // // 6. Create a new PurchaseEntry instance
    const newSalesEntry = new Sales({
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
    const savedEntry = await newSalesEntry.save();

    // handle raw material stock updation (production entry)
    await updateRawMaterials(name, quantity, 'decrease')
    // await updateStock(savedEntry.itemId, quantity, 'decrease');
    // // 8. Prepare data to return to the frontend
    const responseData = {
        ...savedEntry.toObject(),  // Convert the saved entry to a plain object
        name,       // Add the item name to the response data
        createdBy: req.user.fullName // Send the user name along with the response
    };

    responseData.createdAt = formatDate(responseData.createdAt);
    responseData.updatedAt = formatDate(responseData.updatedAt);
    // 9. Send back the saved entry as a response
    res.status(200).json(new ApiResponse(200, responseData, 'Sales entry created successfully!', 'Success'))
});



const getAllSales = asyncHandler(async (req, res) => {
    const salesEntries = await Sales.find()
        .sort({ createdAt: -1 })
        .populate('itemId', 'name')  // Populate only the 'name' field of the referenced Item
        .populate('createdBy', 'fullName')  // Populate only the fullName of the user
        .exec();



        if (!salesEntries || salesEntries.length === 0) {
            return res.status(404).json(
                new ApiResponse(404, {}, "No Purchase found", "Error")
            );
        }
    
    
        // 3. Convert createdAt and updatedAt fields into readable format for each item
        const responseData = salesEntries.map(entry => ({
            ...entry.toObject(),
            name: entry.itemId?.name || '-',   // Extract item name
            createdAt: formatDate(entry.createdAt),  // Format createdAt
            updatedAt: formatDate(entry.updatedAt),  // Format updatedAt
            createdBy: entry.createdBy ? entry.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
        }));

    // Format the response to include the item name and other fields from PurchaseEntry
    // const formattedEntries = salesEntries.map(entry => ({
    //     _id: entry._id,
    //     name: entry.itemId.name,   // Extract item name
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
    res.status(200).json(new ApiResponse(200, responseData || [], 'Sales entries fetched successfully!', 'Success'))
}
);


// delete an item from the database
const deleteSale = asyncHandler(async (req, res) => {
    console.log('sale')
    const { id } = req.params;  // Extract the purchase ID from the URL parameters
    // Check if the item exists in the database
    const salesEntry = await Sales.findById(id);

    if (!salesEntry) {
        // If the item doesn't exist, return a 404 error
        return res.status(404).json({ message: 'No sale found' });
    }

    const item = await Item.findById(salesEntry.itemId, 'name');
    // update the raterial stock 
    await updateRawMaterials(item.name, salesEntry.quantity, 'increase')


    // 3. Remove associated files
    if (salesEntry.documents && salesEntry.documents.length > 0) {
        await Promise.all(
            salesEntry.documents.map(async (doc) => {
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
    await Sales.findByIdAndDelete(id);
    // Return a success response
    return res.status(200).json(
        new ApiResponse(200, { id }, "Deleted successfully", "Success")
    );

});


const updateSalesEntry = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = parsedData(req.body);

    // First fetch the sales entry
    const salesEntry = await Sales.findById(id);
    if (!salesEntry) {
        return res.status(404).json({ message: 'No sale found' });
    }

    // Get the current item using itemId from salesEntry
    const currentItem = await Item.findById(salesEntry.itemId);
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
                // Update stock for old item (increase)
                await updateRawMaterials(currentItem.name, salesEntry.quantity, 'increase');

                // Update stock for new item (decrease)
                await updateRawMaterials(data.name, salesEntry.quantity, 'decrease');

                // Update the itemId in salesEntry
                salesEntry.itemId = newItem._id;
                isUpdated = true;
            }
        }
        else if (key === 'unitPrice') {
            if (salesEntry[key] !== data[key]) {
                console.log('unitprice')
                const newTaxableAmount = salesEntry.quantity * data[key];
                const newTaxAmount = newTaxableAmount * (newItem?.gstRate || currentItem.gstRate) / 100;
                const newTotalAmount = newTaxableAmount + newTaxAmount;

                salesEntry[key] = data[key];
                salesEntry.taxableAmount = newTaxableAmount;
                salesEntry.taxAmount = newTaxAmount;
                salesEntry.totalAmount = newTotalAmount;
                isUpdated = true;
            }
        }
        else if (key === 'quantity') {
            if (salesEntry[key] !== data[key]) {
                console.log('quantity')
                let newQuantity;
                if (data[key] > salesEntry[key]) {
                    console.log('decrease')
                    newQuantity = data[key] - salesEntry[key];
                    await updateRawMaterials(newItem?.name || currentItem.name, newQuantity, 'decrease');
                } else {
                    console.log('increase')
                    newQuantity = salesEntry[key] - data[key];
                    await updateRawMaterials(newItem?.name || currentItem.name, newQuantity, 'increase');
                }

                const newTaxableAmount = salesEntry.unitPrice * data[key];
                const newTaxAmount = newTaxableAmount * (newItem?.gstRate || currentItem.gstRate) / 100;
                const newTotalAmount = newTaxableAmount + newTaxAmount;

                salesEntry.taxableAmount = newTaxableAmount;
                salesEntry.taxAmount = newTaxAmount;
                salesEntry.totalAmount = newTotalAmount;

                salesEntry[key] = data[key];
                isUpdated = true;
            }
        }
        else if (salesEntry[key] !== undefined && data[key] !== salesEntry[key]) {
            console.log('other one')
            salesEntry[key] = data[key];
            isUpdated = true;
        }
    }

    if (isUpdated) {
        console.log('triggered')
        await salesEntry.save();
    }

    // Prepare response data - include the item name in the response
    const responseData = {
        ...salesEntry.toObject(),
        name: newItem?.name || currentItem.name
    };
    responseData.createdAt = new Date(responseData.createdAt).toLocaleDateString();

    return res.status(200).json(
        new ApiResponse(200, responseData, isUpdated ? "Updated successfully" : "No changes detected!", "Success")
    );
});


export {
    createSale,
    getAllSales,
    deleteSale,
    updateSalesEntry
}