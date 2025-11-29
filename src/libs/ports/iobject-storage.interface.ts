

export interface IObjectStorage{
    uploadFile(filePath: string, folder: string): Promise<{url: string; publicId: string}>;
    deleteFile(publicId: string): Promise<void>;
}