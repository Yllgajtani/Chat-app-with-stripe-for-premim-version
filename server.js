const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

//Servimi statik per frontend
app.use(express.static('public'));
app.use(express.json());

//konfigurimi i Socket.io
let users = [];
io.on('connection', (socket) => {
    console.log('A user connected');
    users.push(socket.id);

    // Handle incoming messages
    socket.on('sendMessage', (msg) => {
        // Broadcast message to all clients except the sender
        socket.broadcast.emit('receiveMessage', msg); 
    });

    // Disconnect user
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        users = users.filter(user => user !== socket.id);
    });
});

//konfigurimi i Stripe
app.post('/create-checkout-session', async (req, res) => {
    try{
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Permium Chat access',
                        },
                        unit_amount: 1500,//15$
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:5000/success',
            cancel_url: 'http://localhost:5000/cancel',
        });
        res.json({ id: session.id });
    }catch(err){
        console.error(err);
    }
});

server.listen(5000, () => {
    console.log('Server is running on port 5000');
});