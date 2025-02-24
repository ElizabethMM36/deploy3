const express = require('express');
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
require('dotenv').config();
const Person = require('./models/person'); // Import the model

// ✅ Middleware Setup
app.use(express.static('dist'))
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
// Get all persons
app.get('/api/persons', async (req, res, next) => {
  try {
    const persons = await Person.find({});
    console.log(`📄 Retrieved ${persons.length} persons`);
    res.json(persons);
  } catch (err) {
    next(err); // Pass error to error handler
  }
});
app.get('/api/persons/:id', async (req, res, next) => {
  try {
    const person = await Person.findById(req.params.id);

    if (!person) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(person); // ✅ Return the person if found
  } catch (error) {
    next(error); // Pass errors to the error handler
  }
});
// Add a new person
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

// ✅ PUT: Update a person's phone number
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

    res.json(updatedPerson); // ✅ Return the updated person
  } catch (error) {
    next(error); // Pass errors to error handler
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


// Delete a person by ID
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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    database: mongoose.connection.readyState,
  });
});

// ✅ Unknown Endpoint Middleware
app.use((req, res) => {
  res.status(404).json({ error: 'Unknown endpoint' });
});

// ✅ Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.message);

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Malformatted ID' });
  } else if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  next(err); // Let Express handle other errors
};

app.use(errorHandler); // Use after routes and unknown endpoint middleware

// ✅ Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

