const monk = require('monk')

// Connection URL
const url = 'localhost:27017/dataa';

const db = monk(url);

db.then(() => {
  console.log('Connected correctly to server')
})
const collection = db.get('document')
collection.insert([{a: 1}, {a: 2}, {a: 3}])
  .then((docs) => {
    // Inserted 3 documents into the document collection
  })
  .then(() => collection.update({ a: 2 }, { $set: { b: 1 } }))
  .then((result) => {
    // Updated the document with the field a equal to 2
  })
  .then(() => collection.remove({ a: 3}))
  .then((result) => {
    // Deleted the document with the field a equal to 3
  })
  .then(() => {

    return collection.find()

  })
  .then((docs) => {
    console.log(docs);
  })
  .then(() => db.close())