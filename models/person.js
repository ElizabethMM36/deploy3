const mongoose = require('mongoose');

// Custom validator for phone number format
const phoneValidator = {
  validator: function (number) {
    // Regex: First part 2-3 digits, hyphen, second part digits, total length >= 8
    return /^\d{2,3}-\d+$/.test(number) && number.replace('-', '').length >= 8;
  },
  message: (props) => `${props.value} is not a valid phone number! Format: XX-XXXXXXX or XXX-XXXXXXX`,
};

// Define schema for phonebook entries
const personSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [3, 'Name must be at least 3 characters long'],
  },
  number: {
    type: String,
    required: [true, 'Number is required'],
    validate: phoneValidator,
  },
});

// Convert documents to JSON
personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

module.exports = mongoose.model('Person', personSchema);

