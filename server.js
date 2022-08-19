const express = require('express');
const path = require('path');
const fs = require('fs');
const util = require('util');

const uuid = require('./helpers/uuid')

const PORT = process.env.PORT || 3001;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static('public'));

app.get('/', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/index.html'))
);

app.get('/notes', (req, res) =>
  res.sendFile(path.join(__dirname, '/public/notes.html'))
);

const readFromFile = util.promisify(fs.readFile);

const writeToFile = (destination, content) =>
  fs.writeFile(destination, JSON.stringify(content, null, 4), (err) =>
    err ? console.error(err) : console.info(`\nData written to ${destination}`)
  );


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


app.get('/api/notes', (req, res) => {
  console.info(`${req.method} request received for notes`);
  readFromFile('./db/db.json').then((data) => res.json(JSON.parse(data)));
});

app.post('/api/notes', (req, res) => {
  console.info(`${req.method} request received to add a note`);

  const { title, text, id } = req.body;

  if (req.body) {
    const newNote = {
      title,
      text,
      id: uuid(),
    };

    readAndAppend(newNote, './db/db.json');
    res.json(`Note added successfully 🚀`);
  } else {
    res.error('Error in adding note');
  }
});

const database = require("./db/db")

app.delete("/api/notes/:id", function (req, res) {
  let jsonFilePath = path.join(__dirname, "/db/db.json");
  for (let i = 0; i < database.length; i++) {
    if (database[i].id == req.params.id) {
      // Splice takes i position, and then deletes the 1 note.
      database.splice(i, 1);
      break;
    }
  }
  fs.writeFileSync(jsonFilePath, JSON.stringify(database), function (err) {

    if (err) {
      return console.log(err);
    } else {
      console.log("Your note was deleted!");
    }
  });
  res.json(database);
});

app.listen(PORT, () =>
  console.log(`App listening at http://localhost:${PORT} 🚀`)
);
