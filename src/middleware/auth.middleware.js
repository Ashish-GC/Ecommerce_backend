import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT=asyncHandler(async(req,_,next)=>{
     try {
        const token = req.cookies?.accessToken ||  req.headers["authorization"]?.replace("Bearer ","") ;
      
        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }
        const decoded = jwt.verify(token, process.env.Access_Token_Secret);
 
        //  console.log(decoded);

        // if the access token is expired 

         // re generate access token using refresh token 
         
    
         const user = await User.findById(decoded._id).select("-password -refreshToken -verifyCode -verifyExpiry")
          
          if(!user){
            throw new ApiError(401,"Invalid AccessToken");
         }

          req.user=user;
        
        next()

     } catch (error) {
        console.log(error)
        throw new ApiError(401,"Unauthorized request");
     }
     
})