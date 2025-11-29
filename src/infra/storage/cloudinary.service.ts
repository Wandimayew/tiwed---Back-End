import { Injectable } from "@nestjs/common";
import {v2 as cloudinary, UploadApiResponse} from 'cloudinary'

@Injectable()
export class CloudinaryService{
    constructor(){
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        })
    }

    async uploadImage(filePath: string, folder: string): Promise<UploadApiResponse>{
        return cloudinary.uploader.upload(filePath,{folder});
    }

    async deleteImage(publicId: string): Promise<UploadApiResponse>{
        return cloudinary.uploader.destroy(publicId);
    }
}