import axios from 'axios';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '../../lib/prisma';

type OxfordWordList = string[];

type DictionaryDefinition = {
    definition?: string;
    example?: string;
};

type DictionaryMeaning = {
    partOfSpeech?: string;
    definitions?: DictionaryDefinition[];
};

type DictionaryPhonetic = {
    text?: string;
};

type DictionaryEntry = {
    phonetic?: string;
    phonetics?: DictionaryPhonetic[];
    meanings?: DictionaryMeaning[];
};

type ProgressState = {
    nextIndex: number;
    processed: number;
    total: number;
    updatedAt: string;
    completed: boolean;
    lastWord?: string | null;
};

type FailedWord = {
    word: string;
    error: string;
    occurredAt: string;
};

const dataDir = path.resolve(process.cwd(), 'src/app/data');
const sourceFile = path.join(dataDir, 'oxford3000.json');
const progressFile = path.join(dataDir, 'progress.json');
const failedFile = path.join(dataDir, 'failed.json');

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const readJsonFile = async <T>(filePath: string): Promise<T | null> => {
    try {
        const content = await readFile(filePath, 'utf8');
        return JSON.parse(content) as T;
    } catch {
        return null;
    }
};

const writeJsonFile = async (filePath: string, data: unknown) => {
    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const requestWithDelay = async <T>(url: string) => {
    await delay(600);
    return axios.get<T>(url);
};

const getBanglaMeaning = async (text: string) => {
    const response = await requestWithDelay<any>(
        'https://translate.googleapis.com/translate_a/single' +
            `?client=gtx&sl=en&tl=bn&dt=t&q=${encodeURIComponent(text)}`
    );

    const translated = response.data?.[0]
        ?.map((segment: any[]) => segment?.[0])
        .filter(Boolean)
        .join('');

    return translated?.trim() || null;
};

const getDictionaryInfo = async (word: string) => {
    const response = await requestWithDelay<DictionaryEntry[]>(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`
    );

    const entry = response.data?.[0];
    const meaning = entry?.meanings?.[0];
    const definition = meaning?.definitions?.[0];

    return {
        meaningEn: definition?.definition?.trim() || null,
        example: definition?.example?.trim() || null,
        partOfSpeech: meaning?.partOfSpeech?.trim() || null,
        phonetic:
            entry?.phonetic?.trim() ||
            entry?.phonetics?.find((item) => item.text?.trim())?.text?.trim() ||
            null,
    };
};

const seedWords = async () => {
    const words = await readJsonFile<OxfordWordList>(sourceFile);

    if (!Array.isArray(words) || words.length === 0) {
        throw new Error('oxford3000.json did not contain any words');
    }

    const progress = await readJsonFile<ProgressState>(progressFile);
    const failedWords = (await readJsonFile<FailedWord[]>(failedFile)) ?? [];

    const startIndex = progress?.completed
        ? words.length
        : (progress?.nextIndex ?? 0);

    for (let index = startIndex; index < words.length; index += 1) {
        const word = words[index]?.trim();

        if (!word) {
            continue;
        }

        try {
            const dictionaryInfo = await getDictionaryInfo(word);
            const banglaMeaning = dictionaryInfo.meaningEn
                ? await getBanglaMeaning(dictionaryInfo.meaningEn)
                : await getBanglaMeaning(word);

            await prisma.word.upsert({
                where: {
                    word,
                },
                create: {
                    word,
                    meaningBn: banglaMeaning,
                    meaningEn: dictionaryInfo.meaningEn,
                    example: dictionaryInfo.example,
                    partOfSpeech: dictionaryInfo.partOfSpeech,
                    phonetic: dictionaryInfo.phonetic,
                },
                update: {
                    meaningBn: banglaMeaning,
                    meaningEn: dictionaryInfo.meaningEn,
                    example: dictionaryInfo.example,
                    partOfSpeech: dictionaryInfo.partOfSpeech,
                    phonetic: dictionaryInfo.phonetic,
                },
            });

            const processed = index + 1;

            await writeJsonFile(progressFile, {
                nextIndex: processed,
                processed,
                total: words.length,
                updatedAt: new Date().toISOString(),
                completed: processed >= words.length,
                lastWord: word,
            } satisfies ProgressState);

            if (processed % 50 === 0) {
                console.log(`Checkpoint saved after ${processed} words.`);
            }
        } catch (error) {
            const message =
                error instanceof Error ? error.message : 'Unknown error';

            failedWords.push({
                word,
                error: message,
                occurredAt: new Date().toISOString(),
            });

            await writeJsonFile(failedFile, failedWords);

            await writeJsonFile(progressFile, {
                nextIndex: index + 1,
                processed: index + 1,
                total: words.length,
                updatedAt: new Date().toISOString(),
                completed: index + 1 >= words.length,
                lastWord: word,
            } satisfies ProgressState);

            console.error(`Failed to seed word "${word}": ${message}`);
        }
    }

    await writeJsonFile(progressFile, {
        nextIndex: words.length,
        processed: words.length,
        total: words.length,
        updatedAt: new Date().toISOString(),
        completed: true,
        lastWord: words.at(-1) ?? null,
    } satisfies ProgressState);

    console.log(`Seed completed for ${words.length} words.`);
};

seedWords()
    .catch((error) => {
        console.error('Seeder failed:', error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
