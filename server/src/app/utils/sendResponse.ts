import { type Response } from 'express';

const sendResponse = <T>(
    res: Response,
    jsonData: {
        statusCode: number;
        success: boolean;
        message: string;
        meta?: {
            page: number;
            limit: number;
            total: number;
        };
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
        data: T | null | undefined;
    }
) => {
    res.status(jsonData.statusCode).json({
        success: jsonData.success,
        message: jsonData.message,
        meta: jsonData.meta || null || undefined,
        pagination: jsonData.pagination || null || undefined,
        data: jsonData.data || null || undefined,
    });
};

export default sendResponse;
