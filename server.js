//Declare dependency variables
const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');
//randomly generate id when called. 
const uuid = require('./helpers/uuid')
//let the port be heroku deployment or localmachine 3001
const PORT = process.env.PORT || 3001;

const app = express();
//define server routes and params. 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/index.html'))
);

app.get('/notes', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/notes.html'))
);
//declare functions for post requests. 
const readFromFile = util.promisify(fs.readFile);
//files get read and written in the same function when new note is made.
const writeToFile = (destination, content) =>
  fs.writeFile(destination, JSON.stringify(content, null, 4), (err) =>
    err ? console.error(err) : console.info(`\nData written to ${destination}`)
  );

//use for post request when note is made.
const readAndAppend = (content, file) => {
  fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
    } else {
      const parsedData = JSON.parse(data);
      parsedData.push(content);
      writeToFile(file, parsedData);
    }
  });
};

//populate the page with notes from db if applicable. 
app.get('/api/notes', (req, res) => {
  console.info(`${req.method} request received for notes`);
  readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data)));
});
//request to add new notw
app.post('/api/notes', (req, res) => {
  console.info(`${req.method} request received to add a note`);
//identify the note by the content of the front end note object. 
  const { title, text, id } = req.body;
//make new object for back end and add a random id to it. 
  if (req.body) {
    const newNote = {
      title,
      text,
      id: uuid(),
    };
    //add this to db.json
    readAndAppend(newNote, './db/db.json');
    res.json(`Note added successfully 🚀`);
  } else {
    res.error('Error in adding note');
  }
});

const database = require("./db/db")
//delete request for note
app.delete("/api/notes/:id", function (req, res) {
  let jsonFilePath = path.join(__dirname, "/db/db.json");
  //loop through the notes by id and find and splice the note that made this request. 
  for (let i = 0; i < database.length; i++) {
    if (database[i].id == req.params.id) {
      database.splice(i, 1);
      break;
    }
  }
  //rewrite the db without the spliced note. 
  fs.writeFileSync(jsonFilePath, JSON.stringify(database), function (err) {

    if (err) {
      return console.log(err);
    } else {
      console.log("Note Deleted!");
    }
  });
  res.json(database);
});
//listening for hosting from the proper port. 
app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT} 🚀`)
);
