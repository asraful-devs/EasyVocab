import { type Prisma, type Word } from '../../../../generated/prisma/client';
import { prisma } from '../../../../lib/prisma';
import ApiError from '../../error/ApiError';
import {
    paginationHelper,
    type IOptions,
} from '../../helpers/paginationHelper';

type WordListParams = {
    level?: string;
    pos?: string;
};

type WordQueryOptions = Pick<IOptions, 'page' | 'limit'>;

type WordPaginationResult = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

type WordListResult = {
    data: Word[];
    pagination: WordPaginationResult;
};

const getAllWords = async (
    filters: WordListParams,
    options: WordQueryOptions
): Promise<WordListResult> => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { level, pos } = filters;

    const where: Prisma.WordWhereInput = {
        ...(level ? { level } : {}),
        ...(pos ? { partOfSpeech: pos } : {}),
    };

    const [total, data] = await Promise.all([
        prisma.word.count({ where }),
        prisma.word.findMany({
            where,
            skip,
            take: limit,
            orderBy: {
                createdAt: 'desc',
            },
        }),
    ]);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        },
    };
};

const getWordByName = async (word: string): Promise<Word> => {
    const normalizedWord = word.trim();

    if (!normalizedWord) {
        throw new ApiError(400, 'Word is required');
    }

    const result = await prisma.word.findUnique({
        where: {
            word: normalizedWord,
        },
    });

    if (!result) {
        throw new ApiError(404, 'Word not found');
    }

    return result;
};

const searchWords = async (q: string): Promise<Word[]> => {
    const query = q.trim();

    if (!query) {
        throw new ApiError(400, 'Search query is required');
    }

    return prisma.word.findMany({
        where: {
            OR: [
                { word: { contains: query, mode: 'insensitive' } },
                { meaningBn: { contains: query, mode: 'insensitive' } },
                { meaningEn: { contains: query, mode: 'insensitive' } },
                { example: { contains: query, mode: 'insensitive' } },
                { partOfSpeech: { contains: query, mode: 'insensitive' } },
                { level: { contains: query, mode: 'insensitive' } },
                { phonetic: { contains: query, mode: 'insensitive' } },
            ],
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};

const getRandomWords = async (
    count: number,
    level?: string
): Promise<Word[]> => {
    if (!Number.isInteger(count) || count <= 0) {
        throw new ApiError(400, 'Count must be a positive integer');
    }

    const allWords = await prisma.word.findMany({
        where: {
            ...(level ? { level } : {}),
        },
    });

    const shuffledWords = [...allWords].sort(() => Math.random() - 0.5);

    return shuffledWords.slice(0, Math.min(count, shuffledWords.length));
};

export const WordService = {
    getAllWords,
    getWordByName,
    searchWords,
    getRandomWords,
};
