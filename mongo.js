const mongoose = require('mongoose');

if (process.argv.length < 3) {
  console.log('Give password as argument');
  process.exit(1);
}

const password = process.argv[2];
const name = process.argv[3];
const number = process.argv[4];

const url = `mongodb+srv://elizabethmathew10d:${password}@cluster0.ep7n1.mongodb.net/phonebook?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.set('strictQuery', false);
mongoose.connect(url)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  });

// ✅ Move Schema and Model Declaration OUTSIDE the .then() block
const personSchema = new mongoose.Schema({
  name: String,
  number: String,
});

const Person = mongoose.model('Person', personSchema);

// ✅ Add a person if name & number are provided
if (name && number) {
  const person = new Person({ name, number });

  person.save()
    .then(() => {
      console.log(`Added ${name} number ${number} to phonebook`);
      return Person.find({});
    })
    .then(result => {
      console.log("Phonebook:");
      result.forEach(p => console.log(`${p.name} - ${p.number}`));
      mongoose.connection.close();
    })
    .catch(err => {
      console.error("Error:", err);
      mongoose.connection.close();
    });
} else {
  // ✅ If no name/number is given, just list all contacts
  Person.find({})
    .then(result => {
      console.log("Phonebook:");
      result.forEach(p => console.log(`${p.name} - ${p.number}`));
      mongoose.connection.close();
    })
    .catch(err => {
      console.error("Error fetching persons:", err);
      mongoose.connection.close();
    });
}
