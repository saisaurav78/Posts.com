const multer = require("multer");
const storage = multer.memoryStorage()
const MulterUpload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 2
    }
})
module.exports = MulterUpload;