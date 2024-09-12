const dotenv = require('dotenv');
dotenv.config();
const path = require('path')
const cloudinary = require('cloudinary').v2
cloudinary.config({
    cloud_name:process.env.Cloud_name,
    api_key: process.env.API_key,
    api_secret: process.env.API_secret
})

function UploadImage(file) {
    return new Promise((resolve, reject) => {
        if (!file) return reject('No file Uploaded')  

cloudinary.uploader.upload_stream({ folder: 'uploads', overwrite: false, use_filename:true},
            (uploadErr, uploadRes) => {
                if (uploadErr) {
                    console.error("Cloudinary upload error:", uploadErr);
                    return reject(uploadErr.message);
                }
                resolve(uploadRes.secure_url);
            }
        ).end(file); 
    })
    
}
module.exports=UploadImage





