import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import multer from 'multer';
import {
    createItem,
    deleteItem,
    getAllItems,
    getItemHistory,
    // getItemNames,
    updateItemInfo,
} from "../controllers/item.controller.js";

// ---------------- purchase API endpoints --------
import {
    createPurchase,
    deletePurchase,
    getAllPurchases,
    updatePurchaseEntry
} from '../controllers/ims/purchase.controller.js'
import { createNewSalesReturn, deleteSalesReturn, getAllSalesReturn } from "../controllers/ims/salesReturn.controller.js";
import { createSale, deleteSale, getAllSales, updateSalesEntry } from "../controllers/ims/sales.controller.js";
import { deleteDefectiveProduct, getAllDefectiveProducts } from "../controllers/ims/defectiveProduct.controller.js";
import { createNewPurchaseReturn, deletePurchaseReturn, getAllPurchaseReturn, updatePurchaseReturnEntry } from "../controllers/ims/purchaseReturn.controller.js";




const router = Router();

const upload = multer({
    dest: 'uploads/purchases',
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});



// router.route('/verify-token').get(verifyJWT, verifyToken)
router.route('/create/itemEntry').post( createItem);
router.route('/list/items').get( getAllItems);
router.route('/delete/itemEntry/:id').delete( deleteItem);
router.route('/update/itemEntry/:id').put( updateItemInfo);
router.route('/history/:itemId').get( getItemHistory);
// router.route('/all/names').get( getItemNames);


// ---------------- purchase routes --------
router.route('/create/purchaseEntry').post( upload.array('documents'), createPurchase);
router.route('/list/purchases').get( getAllPurchases);
router.route('/delete/purchaseEntry/:id').delete( deletePurchase);
router.route('/update/purchaseEntry/:id').put( upload.array('documents'), updatePurchaseEntry);


// ---------------- sales  routes --------
router.route('/create/salesEntry').post( upload.array('documents'), createSale);
router.route('/list/sales').get( getAllSales);
router.route('/delete/salesEntry/:id').delete( deleteSale);
router.route('/update/salesEntry/:id').put(upload.array('documents'), updateSalesEntry);



// ---------------- sales return routes --------
router.route('/create/salesReturnEntry').post( upload.array('documents'), createNewSalesReturn);
router.route('/list/sales-return').get( getAllSalesReturn);
router.route('/delete/salesReturnEntry/:id').delete( deleteSalesReturn);



// ---------------- purcahse return routes --------
router.route('/create/purchaseReturnEntry').post( upload.array('documents'), createNewPurchaseReturn);
router.route('/list/purchase-return').get( getAllPurchaseReturn);
router.route('/delete/purchaseReturnEntry/:id').delete(deletePurchaseReturn);
router.route('/update/purchaseReturnEntry/:id').put(upload.array('documents'), updatePurchaseReturnEntry);



// ---------------- defective products routes --------
router.route('/list/defectiveProducts').get(getAllDefectiveProducts);
router.route('/delete/defectiveProductEntry/:id').delete( deleteDefectiveProduct);



export default router;