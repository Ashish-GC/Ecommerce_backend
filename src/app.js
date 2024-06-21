import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

export const app = express();


app.use(cors({
    options:process.env.Cors_Origin
}))


app.use(express.json({limit:"16kb"}))

app.use(express.urlencoded({extended:true ,limit:"16kb"}))

app.use(express.static("public"))

app.use(cookieParser())

