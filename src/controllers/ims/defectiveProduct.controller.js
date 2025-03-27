import { DefectiveProduct } from "../../models/ims/defectiveProduct.model.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { formatDate } from "../../utils/helper.js";

const getAllDefectiveProducts=asyncHandler(async(req,res)=>{
    const defectiveProducts = await DefectiveProduct.find()
    .sort({ createdAt: -1 })
    .populate('itemId', 'name')  // Populate only the 'name' field of the referenced Item
    .exec(); 

    const defectiveProductsList = defectiveProducts.map(entry => ({
        ...entry.toObject(),
        name:entry.itemId?.name||'',
        createdAt: formatDate(entry.createdAt),  // Format createdAt
        updatedAt: formatDate(entry.updatedAt),  // Format updatedAt
        // createdBy: entry.createdBy ? entry.createdBy.fullName : 'Unknown'  // Send the user's fullName as createdBy
      }));


// console.log('purchaseEntries', formattedEntries)
res.status(200).json(new ApiResponse(200, { defectiveProductsList: defectiveProductsList || [] }, 'Defective Product entries fetched successfully!', 'Success'))
})


// =========================   delete defective product enrty from the database =====================================
const deleteDefectiveProduct = asyncHandler(async (req, res) => {

    // 1. Extract the item ID from the URL parameters
    const { id } = req.params;
    // 2. Check if the item exists in the database
    const defectiveProduct = await DefectiveProduct.findById(id);
  
    // 3. If the item doesn't exist, return a 404 error
    if (!defectiveProduct) {
      return res.status(404).json({ message: 'No item found' });
    }
  
    // 4. Delete the item from the database
    await DefectiveProduct.findByIdAndDelete(id);
  
    // 5. Return a success response
    return res.status(200).json(
      new ApiResponse(200, { id }, "Defective Product entry deleted successfully!", "Success")
    );
  
  });

export {
    getAllDefectiveProducts,
    deleteDefectiveProduct
}