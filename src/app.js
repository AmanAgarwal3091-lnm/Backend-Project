import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app= express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true,
}))
//configuration so that express can accept data in different form 
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes

import userRouter from "./routes/user.routes.js"




//routes declatration
//pehle directly idhar hi route aur controller likh rhe the par ab humne router alag jagah kr dia hain to ab .use use krke middleware ki help se lana hoga

app.use("/api/v1/users",userRouter) //jaise hi koi type krega /user hum control de denge userRouter pe jo ki userRouter file pe control dega aur route pe leke jaega
//iise hhttp://localhost:8000/api/v1/users pe hoga dfir jab userRoute pe jaega to aage / register hai ya / login us according aage ke controller work krte

export { app }