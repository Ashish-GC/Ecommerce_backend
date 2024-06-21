
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";


const userSchema =new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        index:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true   
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    verifyCode:{
        type:String
    },
    password:{
        type:String,
        required:[true,"Password is required"]
      },
      refreshToken:{
        type:String,
      }
},{timestamps:true})


// password check

userSchema.pre('save', async function(next){
 if(this.isModified("password")){
     this.password = await bcrypt.hash(this.password,13)
 }
    next();
})

userSchema.methods.isPasswordCorrect =async function(password){
   return await bcrypt.compare(password,this.password)
}

// generating refresh and access token 







export const User = mongoose.model('User',userSchema)