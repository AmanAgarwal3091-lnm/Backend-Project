import { asyncHandler } from "../utils/asyncHandler.js";

import{ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const generateAccessAndRefreshTokens = async (userId)=>{
    try{
const user  = await User.findById(userId)
const acceessToken = user.generateAccessToken()
const refreshToken= user.generateRefreshToken()

user.refreshToken= refreshToken
await user.save({validateBeforeSave : false})

return {acceessToken, refreshToken}

    }catch (error){
        throw new ApiError(500,"Something went wrong while genrating refresh and access token")
    }
}
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
const loginUser= asyncHandler( async(req, res)=>{
// req body ->data
// username or email
//find the user
// if not user then we say not exist
// if exist then password check
// if password check then generate access and refresh token and send to user 
//send them in cookies
//send response successfully login 

const {email, username, password} = req.body
if(!username ||!email){
    throw new ApiError(400,"Username or email is required"  )
}
const user = await User.findOne({
    $or:[{username},{email}]
})
if(!user){
    throw new ApiError(404,"User does not Exist")
}
//jo aapne method banaya hai na like isPasswordCorrect aisa to ye keval aapke user se accesable hai na ki User kyoki User mongoose ka ek object hai and yse User findOne liuke mongoose ki functionality ko access kr sakta hai 
const isPasswordvalid =  await user.isPasswordCorrect(password)
if(!isPasswordvalid){
    throw new ApiError(401,"Invalid user credentials")
}
const {acceessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

// making cookies
const options= {
    //ye dono httpOnly and secure ko true krne se cookie keval server se modifible hoti hai 
    httpOnly: true,
    secure: true
}

return res
.status(200)
.cookie("accessToken", acceessToken,options)
.cookie("refreshToken", refreshToken,options)
.json(
    new ApiResponse(200,{
        user: loggedInUser, acceessToken, refreshToken
    },
    "User logged in Successfully"
)
)



})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id, // pehle to ye batao find kaise krna hai
        //fir batao update krna kya hai jike lie set operator use krte
        {
            $set:{
                refreshToken: undefined
            }
        },{
            new: true
        }

    )
    const options= {
        //ye dono httpOnly and secure ko true krne se cookie keval server se modifible hoti hai 
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken",options)
    .json(
       new ApiResponse(200,{},"User logged Out") 
    )



})


export {
    registerUser,
    loginUser,
    logoutUser
}