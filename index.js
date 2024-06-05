const express = require('express');
const path = require('path');

const app = express();

const port = process.env.PORT || 3001;


app.use(express.static(__dirname + '/html'));
app.use(express.static(__dirname + '/uploads'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', require('./routes/uploadRouter'));

app.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
})


app.listen(port, () => { console.log(`App listening on port ${port}`); });