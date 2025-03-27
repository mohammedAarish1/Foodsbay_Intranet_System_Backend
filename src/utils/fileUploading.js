import path from 'path';
import fs from 'fs';

// import { v4 as uuidv4 } from 'uuid';

// Document Storage Service (Abstraction Layer)
class DocumentStorageService {
    constructor(strategy = 'local') {
        this.strategy = strategy;
    }

    // Local file system storage
    async saveLocal(file, uploadPath) {
        try {
            // Ensure upload directory exists
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }

            // Generate unique filename
            // const uniqueFilename = `${uuidv4()}-${file.originalname}`;
            const uniqueFilename = `${Math.random()}-${file.originalname}`;
            const filePath = path.join(uploadPath, uniqueFilename);

            // Move file
            await fs.promises.rename(file.path, filePath);

            return {
                originalName: file.originalname,
                filename: uniqueFilename,
                path: filePath,
                relativePath: path.relative(process.cwd(), filePath)
            };
        } catch (error) {
            console.error('Local storage error:', error);
            throw error;
        }
    }

    // Placeholder for cloud storage strategies
    async saveCloud(file) {
        // Future implementation for cloud storage (e.g., AWS S3, Google Cloud Storage)
        throw new Error('Cloud storage not implemented');
    }

    async save(file, uploadPath = path.join(process.cwd(), 'uploads', 'purchases')) {
        switch (this.strategy) {
            case 'local':
                return this.saveLocal(file, uploadPath);
            case 'cloud':
                return this.saveCloud(file);
            default:
                throw new Error('Invalid storage strategy');
        }
    }
}

export {
    DocumentStorageService
}