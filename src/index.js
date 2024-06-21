import connectDatabase from "./db/index.js"
import { app } from "./app.js"
import 'dotenv/config'

const port = process.env.PORT || 8000

connectDatabase().then(()=>{
    
    app.use("error",(err)=>{console.log(err)})

    app.listen(port,()=>{
        console.log(`Server is running on PORT :${port}`)
    })

}).catch((err)=>{
 console.log("connection error",err)
})
