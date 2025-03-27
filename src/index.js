import 'dotenv/config'
import connectDB from './db/db.js';
import { app } from './app.js';

const port=process.env.PORT || 5000;
connectDB()
    .then(() => {
        app.on('error', (error) => {
            console.log('ERRR', error)
            throw error;
        })
        app.listen(port,()=>{
            console.log(`Server is running on port ${port}`)
        })
    })
    .catch((error) => {
        console.log('Error connecting to database', error)
    })