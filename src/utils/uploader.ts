import {v2 as cloudinary} from 'cloudinary';
import {CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME} from './env';

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});

const toDataURL = (file: Express.Multer.File) => {
    const base64 = file.buffer.toString('base64');
    return `data:${file.mimetype};base64,${base64}`;
};

const getPublicIdFromUrl = (fileUrl: string) => {
    const publicId = fileUrl.substring(fileUrl.lastIndexOf('/') + 1, fileUrl.lastIndexOf('.'));
    return publicId;
};

export default {
    async uploadSingle(file: Express.Multer.File){
        const fileDataURL = toDataURL(file);
        const result = await cloudinary.uploader.upload(fileDataURL, {resource_type:'auto'});
        return result.secure_url;
    },
    async uploadMultiple(file: Express.Multer.File[]){
        const uploadBatch = file.map((item) => {
            const result = this.uploadSingle(item);
            return result;
        });
        const result = await Promise.all(uploadBatch);
        return result;
    },
    async remove(fileUrl: string){
        const publicId = getPublicIdFromUrl(fileUrl);
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    },
}