// import express, body-parser and validator
const express = require("express")
const bodyParser = require("body-parser")
const validator = require("validator")
const app = express()
app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))
const https = require("https")

// direct to index
app.get('/',(req,res)=>{
    res.sendFile(__dirname + "/index.html")
})

// import mangoose and connect to local mangoDB
const mongoose = require("mongoose")
mongoose.connect("mongodb://localhost:27017/iServiceDB", {useNewUrlParser:true})

const customerSchema = new mongoose.Schema({
    residence: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        validate(value){
            if (!validator.isEmail(value)){
                throw new Error("Email is invalid !")
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength:8
    },
    confirmPassword: {
        type: String,
        required: true,
        minlength:8,
    },
    address: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    postalCode: Number,
    phoneNumber: String
})

const Customer = mongoose.model('Customers', customerSchema)

app.post('/',(req,res)=>{
    try {
        const newCustomer = new Customer(req.body)
        // validate if the password and confirm password are the same
        if(!validator.equals(newCustomer.password, newCustomer.confirmPassword)){
            throw new Error("Password are not the same !")
        }
        // save new customer to the mongoDB
        newCustomer.save((err)=>{
            if(err){
                res.send(err.message)
            }
            else{
                // MailChimp
                const apiKey = "0edd295d30385d1d27970e4898c46c71-us5"
                const listId = "bbe91ad837"
                const data = {
                    members: [{
                        email_address: newCustomer.email,
                        status: "subscribed",
                        merge_fields:{
                            FNAME: newCustomer.firstName,
                            LNAME: newCustomer.lastName
                        }
                    }]
                }
                // to json
                const jsonData = JSON.stringify(data)
                const url = "https://us5.api.mailchimp.com/3.0/lists/bbe91ad837"
                const options = {
                    method: "POST",
                    auth: "azi:0edd295d30385d1d27970e4898c46c71-us5"
                }

                // send the data
                const request = https.request(url, options, (response)=>{
                    response.on("data", data =>{
                        console.log(JSON.parse(data))
                    })
                })

                request.write(jsonData)
                request.end()

                console.log("New customer added!")
                res.send("New customer added successully!")
            }
        })
    } catch (e) {
        console.log(e)
        res.send(e.message)
    }
})

// ------------------ API ---------------------
app.route('/experts')
    // endpoint to add new expert
    .post((req,res)=>{
        const newCustomer = new Customer(req.body)
        newCustomer.save((err)=>{
            if(err){
                res.send(err.message)
            }
            else{
                res.send('Successfully added a new customer!')
            }
        })
    })
    // endpoint to get all experts
    .get((req,res)=>{
        Customer.find((err,experts)=>{
            if(!err){
                res.send(experts)
            }
            else{
                res.send(err)
            }
        })
    })
    // endpoint to delete all experts
    .delete((req,res)=>{
        Customer.deleteMany((err)=>{
            if(err){
                res.send(err)
            }
            else{
                res.send('Successfully deleted all experts!')
            }
        })
})

app.route('/experts/:id')
    // retrieve specific expert
    .get((req,res)=>{
        Customer.findOne({_id: req.params.id}, (err, foundExpert) =>{
            if(foundExpert){
                res.send(foundExpert)
            }
            else{
                res.send('No matched expert found!')
            }
        })
    })
    // update specific expert
    .put((req,res)=>{
        Customer.findOneAndUpdate(
            {_id: req.params.id},
            req.body,
            {overwrite:true},
            (err)=>{
                if(err){
                    res.send(err)
                }
                else{
                    res.send('Successfully updated!')
                }
            }
        )
    })
    // update partially specific expert
    .patch((req,res)=>{
        Customer.findOneAndUpdate(
            {_id: req.params.id},
            {$set: req.body},
            function(err){
                if(!err){
                    res.send('Successfully updated expert.')
                }
                else{
                    res.send(err)
                }
            }
        )
    })
    // delete specific expert
    .delete((req,res)=>{
        Customer.findOneAndDelete(
            {_id: req.params.id},
            (err)=>{
                if(err){
                    res.send(err)
                }
                else{
                    res.send('Successfully deleted specific expert!')
                }
            })
})

app.listen(8080, function (request, response){
    console.log("Server is running on port 8080")
})