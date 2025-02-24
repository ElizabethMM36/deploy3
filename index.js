const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();
const cors = require('cors');
require('dotenv').config();
const Person = require('./models/person');

// ✅ Middleware Setup
app.use(express.static(path.join(__dirname, 'dist'))); // Serve frontend build
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ Error connecting to MongoDB:', err.message);
    process.exit(1); // Stop server if connection fails
  });

// ✅ Routes
app.get('/api/persons', async (req, res, next) => {
  try {
    const persons = await Person.find({});
    console.log(`📄 Retrieved ${persons.length} persons`);
    res.json(persons);
  } catch (err) {
    next(err);
  }
});

app.get('/api/persons/:id', async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);
    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }
    res.json(person);
  } catch (error) {
    next(error);
  }
});

app.post('/api/persons', async (req, res, next) => {
  const { name, number } = req.body;
  if (!name || !number) {
    return res.status(400).json({ error: 'Name and number are required' });
  }

  try {
    const existingPerson = await Person.findOne({ name });
    if (existingPerson) {
      return res.status(409).json({ error: 'Name already exists' });
    }

    const newPerson = new Person({ name, number });
    const savedPerson = await newPerson.save();
    console.log(`✅ Added new person: ${savedPerson.name}`);
    res.status(201).json(savedPerson);
  } catch (err) {
    next(err);
  }
});

app.put('/api/persons/:id', async (req, res, next) => {
  const { name, number } = req.body;
  if (!name || !number) {
    return res.status(400).json({ error: 'Name and number are required' });
  }

  try {
    const updatedPerson = await Person.findByIdAndUpdate(
      req.params.id,
      { name, number },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!updatedPerson) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(updatedPerson);
  } catch (error) {
    next(error);
  }
});

app.get('/info', async (req, res, next) => {
  try {
    const count = await Person.countDocuments({});
    res.send(`
      <p>Phonebook has info for ${count} people</p>
      <p>${new Date()}</p>
    `);
  } catch (err) {
    next(err);
  }
});

app.delete('/api/persons/:id', async (req, res, next) => {
  try {
    const deletedPerson = await Person.findByIdAndDelete(req.params.id);
    if (!deletedPerson) {
      return res.status(404).json({ error: 'Person not found' });
    }

    console.log(`🗑️ Deleted person with ID: ${req.params.id}`);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    database: mongoose.connection.readyState,
  });
});

// ✅ Serve Frontend for Unknown Routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ✅ Unknown Endpoint Middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Unknown endpoint' });
});

// ✅ Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Malformatted ID' });
  } else if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Server error' });
});

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


