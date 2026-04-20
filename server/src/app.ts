import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, {
    type Application,
    type Request,
    type Response,
} from 'express';
import globalErrorHandler from './app/middlewares/globalErrorHandler';
import notFound from './app/middlewares/notFound';
import router from './app/routes';

const app: Application = express();

// console.log('update stripe')

app.use(
    cors({
        origin: 'https://localhost:5173',
        credentials: true,
    })
);

//parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/v1', router);

app.get('/', (req: Request, res: Response) => {
    res.send({
        Message: 'EasyVocab Server..',
        RunningTime: process.uptime().toFixed(2) + ' seconds',
        Time: new Date().toLocaleTimeString(),
    });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
