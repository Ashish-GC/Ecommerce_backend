
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
        trim:true  ,
        match:[/^\S+@\S+\.\S+$/ ,'please use a valid email address'] 
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    verifyCode:{
        type:String,
        required:[true,"Password is required"]
    },
    verifyCodeExpiry:{
        type:Date,
        required:[true,"Verify Code expiry date is required"]
    },
    password:{
        type:String,
        required:[true,"Password is required"]
      },
      refreshToken:{
        type:String,
      }
},{timestamps:true})


// password 

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

userSchema.methods.generateAccessToken = async function(){
      return jwt.sign({
       _id:this.id , email:this.email , username: this.username 
      },process.env.Access_Token_Secret,{
        expiresIn:process.env.Access_Token_Expiry
      })
}
userSchema.methods.generateRefreshToken = async function(){
    return jwt.sign({
        _id:this._id
    },process.env.Refresh_Token_Secret,{
        expiresIn:process.env.Refresh_Token_Expiry
      })
}


export const User = mongoose.model('User',userSchema)