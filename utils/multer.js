const multer = require("multer");
const storage = multer.memoryStorage()
const MulterUpload = multer({
    storage: storage
})
module.exports = MulterUpload;