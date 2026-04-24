import type { Request, Response } from 'express';
import status from 'http-status';
import ApiError from '../../error/ApiError';
import pick from '../../helpers/pick';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { WordService } from './word.service';

const GetAllWords = catchAsync(async (req: Request, res: Response) => {
    try {
        const query = pick(req.query, ['page', 'limit', 'level', 'pos']);

        const result = await WordService.getAllWords(
            {
                level: query.level,
                pos: query.pos,
            },
            {
                page: query.page,
                limit: query.limit,
            }
        );

        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: 'Words retrieved successfully!',
            pagination: result.pagination,
            data: result.data,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to fetch words';
        const statusCode = error instanceof ApiError ? error.statusCode : 500;

        res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

const GetWord = catchAsync(async (req: Request, res: Response) => {
    try {
        const { word } = req.params as { word?: string };
        const result = await WordService.getWordByName(word || '');

        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: 'Word retrieved successfully!',
            data: result,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to fetch word';
        const statusCode = error instanceof ApiError ? error.statusCode : 500;

        res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

const SearchWords = catchAsync(async (req: Request, res: Response) => {
    try {
        const result = await WordService.searchWords(String(req.query.q || ''));

        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: 'Words searched successfully!',
            data: result,
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Failed to search words';
        const statusCode = error instanceof ApiError ? error.statusCode : 500;

        res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

const GetRandomWords = catchAsync(async (req: Request, res: Response) => {
    try {
        const count = Number(req.query.count) || 10;
        const level = req.query.level ? String(req.query.level) : undefined;
        const result = await WordService.getRandomWords(count, level);

        sendResponse(res, {
            statusCode: status.OK,
            success: true,
            message: 'Random words retrieved successfully!',
            data: result,
        });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : 'Failed to fetch random words';
        const statusCode = error instanceof ApiError ? error.statusCode : 500;

        res.status(statusCode).json({
            success: false,
            message,
        });
    }
});

export const WordController = {
    GetAllWords,
    GetWord,
    SearchWords,
    GetRandomWords,
};
