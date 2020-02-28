Подключение к базе через node

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb+srv://admin:<password>@cluster0-r5nbv.mongodb.net/test?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(err => {
  const collection = client.db("test").collection("devices");
  // perform actions on the collection object
  client.close();
});

Подключение через питон

client = pymongo.MongoClient("mongodb+srv://admin:<password>@cluster0-r5nbv.mongodb.net/test?retryWrites=true&w=majority")
db = client.test


User : admin
Password : adminroot