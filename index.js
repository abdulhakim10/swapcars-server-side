const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { query } = require('express');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.47nvmfs.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        const carCollection = client.db('swapcarsDb').collection('cars');
        const categoryCollection = client.db('swapcarsDb').collection('categories');
        const bookingCollection = client.db('swapcarsDb').collection('bookings');
        const userCollection = client.db('swapcarsDb').collection('users');
        
        // get all cars
        app.get('/cars', async(req, res) => {
            const query = {};
            const cars = await carCollection.find(query).toArray();
            res.send(cars);
        })
        // get car info by id
        app.get('/categories/:id', async(req, res) => {
            const id = req.params.id;
            const query = {category_id: id};
            const cars = await carCollection.find(query).toArray();
            res.send(cars);
        })

        // get all cars
        app.get('/categories', async(req, res) => {
            const query = {};
            const categories = await categoryCollection.find(query).toArray();
            res.send(categories);
        });

        // add booking
        app.post('/bookings', async(req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })
        app.get('/bookings', async(req, res) => {
            const query = {};
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
            console.log(result);
        });

        // add users
        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
            console.log(result)
        })
    }
    finally{

    }
}
run().catch(err => console.error(err));

app.get('/', (req, res) => {
    res.send('swapcars server is running');
})

app.listen(port, (req, res) => {
    console.log('server is running on', port);
})