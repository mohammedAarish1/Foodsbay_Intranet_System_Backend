import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandler.middleware.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ limit: '16kb', extended: true }));
app.use(express.static('public')); // to keep files or folders on server if needed;
app.use(cookieParser());



// import routes
// import userRouter from '../src/routes/user.routes.js';
import authRouter from '../src/routes/auth.routes.js';
import itemRouter from '../src/routes/item.routes.js';
import employeeRouter from '../src/routes/HRMS/employee.routes.js';
// user specific routes
import usersRouter from '../src/routes/USER/users.routes.js'


// routes declaration
// app.use('/api/v1/user', userRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/item', itemRouter);
app.use('/api/v1/hrms', employeeRouter);

// user routes declaration
app.use('/api/v1/users', usersRouter);

// Using the error handler as the last middleware (it will send any server error to the client)
app.use(errorHandler);


export { app };