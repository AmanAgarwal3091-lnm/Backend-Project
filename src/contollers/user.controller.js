import { asyncHandler } from "../utils/asyncHandler.js";

import{ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser= asyncHandler (async(req,res)=>{
    //get user detail from frontend 
    //validation :m ki sab cheeze sahi hai ya nhi ya sabkuch empty to nhi hai 
    //check if user already exist or not : username and email both
    // Files are present or not  i.e. check for images then check for Avatar
    //upload them to cloudinary, avatar
    //create user Object as we store data in mongodb 
    //remove password and refresh token field from response 
    //check for user creation
    //return response 



    //getting user detail from frontend

     const {fullname, email, username, password} = req.body
     console.log("email",email);
     if([fullname, email, username, password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fileds are required")
     }
     const existedUser =await User.findOne({ // User database se directly connect kr sakta hai as ye mongoose se bana hai yaad hai User = mongoose.model islie Use use kr rhe 
        //aur findOne ek method hai jo batat ki user exist krta hai ya nhi 
        $or:[{username},{email}] //ye dollar sign use krke or parameter use krte hau taki check krle findOne me kya inme se koi present hai ya nhi , idhar hum dekh rhe ki same username or email exist nhi krna chahiye, aise object me hi pass krte

     })
     if(existedUser){
        throw new ApiError(409, "User with email or username exist")
     }
//req.body se data ata hai par middleware req ke andar aur fields add krta hai

     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is required")
  }

 const avatar=  await uploadOnCloudinary(avatarLocalPath)
 const coverImage=  await uploadOnCloudinary(coverImageLocalPath)

if(!avatar){
    throw new ApiError(400,"Avatar file is required")
}
//database se baat krne ke lie User ka use krte as it is connected to mongoose
//we use .create() method
const user = await User.create({
fullname,
avatar: avatar.url,
coverImage: coverImage?.url || "",
email,
password,
username: username.toLowerCase()

})
//mongodb apne aap har ek entry ke sath _id entry enter krdeta hai
//.findById se .select method se milta hai jisse alag alag field select kr sakte hai
const createdUser= await User.findById(user._id).select(
//isme wo wo likhte hai jo jo nhi chahiye negative lagake likhete hai 
"-password -refreshToken"
)
if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering the User");
}
return res.status(201).json(
    new ApiResponse(200,createdUser, "User registered Successfully")
)
})

export {registerUser}