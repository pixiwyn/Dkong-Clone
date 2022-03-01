const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

app.use('/assets', express.static('assets'));
app.use('/src', express.static('src'));

app.get('/', (req, res) => 
    res.sendFile(path.resolve('./index.html'))
);

app.listen(port, () => console.log(`Server: http://localhost:${port}`));