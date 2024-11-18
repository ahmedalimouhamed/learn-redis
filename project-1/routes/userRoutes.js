import express from 'express';
import User from '../models/User.js';
import redis from '../config/redis.js';

const userRoutes = express.Router();

userRoutes.get('/users', async(req, res) => {
  try{
    const cachedUsers = await redis.get('users');

    if(cachedUsers){
      console.log('Returning users from Redis cache');
      return res.json(JSON.parse(cachedUsers));
    }

    const users = await User.find();
    console.log('Fetching users from mongodb');

    await redis.setex('users', 3600, JSON.stringify(users));
    res.json(users);

  }catch(err){
    res.status(500).json({message: 'Server error ', err});
  }
});

userRoutes.post('/users', async(req, res) => {
  const {name, email} = req.body;

  try{
    const newUser = new User({name, email});
    await newUser.save();
    await redis.del('users');
    res.status(201).json(newUser);
  }catch(err){
    res.json(500).json({message: 'Error adding user ', err});
  }
});

export default userRoutes;