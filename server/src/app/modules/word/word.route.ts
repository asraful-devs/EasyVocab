import express from 'express';
import { WordController } from './word.controller';

const router = express.Router();

router.get('/random', WordController.GetRandomWords);

router.get('/search', WordController.SearchWords);

router.get('/:word', WordController.GetWord);

router.get('/', WordController.GetAllWords);

export const wordRoutes = router;
