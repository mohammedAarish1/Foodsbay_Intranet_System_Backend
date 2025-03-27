import multer from "multer";

const upload=multer({
    dest: 'uploads/purchases',
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
})


export {upload}