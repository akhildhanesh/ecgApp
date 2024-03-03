const express = require('express')
const app = express()
const cors = require('cors')

const PORT = process.env.PORT || 8080

const { exec } = require('child_process');

const commandToRun = './SoundCardECG.exe';

app.use(cors())

app.get('/run', (req, res) => {
    exec(commandToRun, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
    })
})

app.listen(PORT, () => {
    console.log(`server running on PORT: ${PORT}`)
})