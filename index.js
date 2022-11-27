const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { query } = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 5000;

// middle wares
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.47nvmfs.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// verify JWT
function verifyJWT(req, res, next){
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send('unauthorized access')
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'});
        }

        req.decoded = decoded;
        next();
    })
}

async function run(){
    try{
        const carCollection = client.db('swapcarsDb').collection('cars');
        const categoryCollection = client.db('swapcarsDb').collection('categories');
        const bookingCollection = client.db('swapcarsDb').collection('bookings');
        const userCollection = client.db('swapcarsDb').collection('users');
        
        // verify admin
        const verifyAdmin = async(req, res, next) => {
            const decodedEmail = req.decoded.email;
            const query = {email: decodedEmail};
            const user = await userCollection.findOne(query);

            if(user?.role !== 'admin'){
                return res.status(403).send({message: 'forbidden'});
            }
            next();
        }


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
        app.post('/bookings',  async(req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking);
            res.send(result);
        })

        // get specific booking by email
        app.get('/bookings', verifyJWT, async(req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;

            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'});
            }
           
            const query = {email: email};
            const result = await bookingCollection.find(query).toArray();
            res.send(result);
            // console.log(result);

        });

        // JWT
        app.get('/jwt', async(req, res) => {
            
            const email = req.query.email;
            const query = {email: email};
            const user = await userCollection.findOne(query);

            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_TOKEN, {expiresIn: '1h'})
                return res.send({accessToken: token});
            }
            res.status(403).send({accessToken: ''});

        })


        // get admin
        app.get('/users/admin/:email', async(req, res) => {
            const email = req.params.email;
            const query = {email};
            const user = await userCollection.findOne(query);
            res.send({isAdmin: user?.role === 'admin'});
        })


        // make admin
        app.put('/users/admin/:id', verifyJWT, verifyAdmin, async(req, res) => {

            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const options = {upsert: true};
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        
        // add users
        app.post('/users', async(req, res) => {
            const user = req.body;
            const result = await userCollection.insertOne(user);
            res.send(result);
            // console.log(result)
        })


        // get all users
        app.get('/users', async(req, res) => {
            const query = {};
            const users = await userCollection.find(query).toArray();
            res.send(users);
        })


        // get sellers
        app.get('/allsellers', async(req, res) => {
            const filter = {type: 'Seller'};
            const sellers = await userCollection.find(filter).toArray();
            res.send(sellers);
        })


        // get buyers
        app.get('/allbuyers', async(req, res) => {
            const filter = {type: 'Buyer'};
            const buyers = await userCollection.find(filter).toArray();
            res.send(buyers);
        })

        
        // delete user
        app.delete('/users/:id', verifyJWT, verifyAdmin, async(req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await userCollection.deleteOne(filter);
            res.send(result)
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