import mongoose from 'mongoose';
import { DB_Name } from '../constants.js';

    const connectDatabase=async()=>{
        try {
            const dbInstance= await mongoose.connect(`${process.env.MONGODB_URI}/${DB_Name}`)
            console.log("database connected")
        } catch (error) {
            console.log("Error in database Connection" + error);
             process.exit(1);
        }
  
}
export default connectDatabase;
