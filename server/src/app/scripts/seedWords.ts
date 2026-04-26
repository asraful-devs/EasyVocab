import { parse } from 'csv-parse';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { prisma } from '../../../lib/prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_FILE = path.join(__dirname, '../data/oxford_enriched.csv');
const BATCH_SIZE = 100;

type CsvWordRow = {
    word?: string;
    meaning_bn?: string;
    meaning_en?: string;
    example?: string;
    part_of_speech?: string;
    phonetic?: string;
    level?: string;
};

type WordSeedData = {
    word: string;
    meaningBn: string | null;
    meaningEn: string | null;
    example: string | null;
    partOfSpeech: string | null;
    phonetic: string | null;
    level: string | null;
};

const normalizeWord = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};

const normalizeOptional = (value: unknown): string | null => {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
};

const toWordSeedData = (row: CsvWordRow): WordSeedData | null => {
    const word = normalizeWord(row.word);
    if (!word) {
        return null;
    }

    return {
        word,
        meaningBn: normalizeOptional(row.meaning_bn),
        meaningEn: normalizeOptional(row.meaning_en),
        example: normalizeOptional(row.example),
        partOfSpeech: normalizeOptional(row.part_of_speech),
        phonetic: normalizeOptional(row.phonetic),
        level: normalizeOptional(row.level),
    };
};

const readWords = async (): Promise<WordSeedData[]> => {
    if (!fs.existsSync(CSV_FILE)) {
        throw new Error(`CSV file not found: ${CSV_FILE}`);
    }

    return await new Promise<WordSeedData[]>((resolve, reject) => {
        const rows: WordSeedData[] = [];
        const parser = parse({
            columns: true,
            skip_empty_lines: true,
            trim: false,
        });

        fs.createReadStream(CSV_FILE)
            .pipe(parser)
            .on('data', (rawRow: CsvWordRow) => {
                const row = toWordSeedData(rawRow);
                if (row) {
                    rows.push(row);
                }
            })
            .on('end', () => resolve(rows))
            .on('error', (error: Error) => reject(error));
    });
};

const run = async (): Promise<void> => {
    console.log('\nStarting word seed...\n');

    const rows = await readWords();
    console.log(`Total rows in source: ${rows.length}`);

    let processed = 0;
    let errors = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);

        const operations = batch.map((row) =>
            prisma.word.upsert({
                where: { word: row.word },
                update: {
                    meaningBn: row.meaningBn,
                    meaningEn: row.meaningEn,
                    example: row.example,
                    partOfSpeech: row.partOfSpeech,
                    phonetic: row.phonetic,
                    level: row.level,
                },
                create: {
                    word: row.word,
                    meaningBn: row.meaningBn,
                    meaningEn: row.meaningEn,
                    example: row.example,
                    partOfSpeech: row.partOfSpeech,
                    phonetic: row.phonetic,
                    level: row.level,
                },
            })
        );

        try {
            const results = await prisma.$transaction(operations);
            processed += results.length;

            const progress = Math.min(i + BATCH_SIZE, rows.length);
            const percent = ((progress / rows.length) * 100).toFixed(1);
            console.log(
                `[${progress}/${rows.length}] ${percent}% - Batch saved`
            );
        } catch (error: unknown) {
            errors += batch.length;
            const message =
                error instanceof Error ? error.message : 'Unknown error';
            console.error(`Batch error at index ${i}: ${message}`);
        }
    }

    console.log('\nSeed completed.');
    console.log(`Inserted/Updated: ${processed}`);
    console.log(`Errors: ${errors}`);
};

run()
    .catch((error: unknown) => {
        const message =
            error instanceof Error ? error.message : 'Unknown error';
        console.error(`Seed failed: ${message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
