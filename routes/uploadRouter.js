const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();
const uploadDir = 'uploads';
const chunkUploadDir = 'uploads/temp';

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(chunkUploadDir)) {
    fs.mkdirSync(chunkUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const chunkStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, chunkUploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${req.body.index}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type.'), false);
    }
}

const numFilesLimit = 3;

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        files: numFilesLimit,
    }
});

const chunkUpload = multer({
    storage: chunkStorage
});

router.post('/upload-single', upload.single('file'), (req, res) => {
    try {
        res.send({
            status: 'Upload success.',
            filename: req.file.filename,
            path: req.file.path
        });
    } catch (err) {
        res.send({
            status: 'Error uploading file.',
            message: err.message
        });
    }
});

router.post('/upload-multiple', (req, res) => {
    upload.array('files', numFilesLimit)(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_COUNT') {
                return res.status(400).send({
                    status: 'Upload failed.',
                    message: `More than ${numFilesLimit} uploaded.`
                });
            } else {
                return res.status(400).send({
                    status: 'Upload failed.',
                    message: err.message
                });
            }
        } else if (err) {
            return res.status(400).send({
                status: 'Uploaded failed.',
                message: err.message
            });
        }

        const filesInfo = req.files.map(file => ({
            filename: file.filename,
            path: file.path
        }));

        res.send({
            status: 'Upload success.',
            files: filesInfo
        });
    });
});

router.post('/upload-large/init', (req, res) => {
    try {
        if (!fs.existsSync(chunkUploadDir)) {
            fs.mkdirSync(chunkUploadDir, { recursive: true });
        }
        return res.send({
            message: 'Upload session initialized.',
        });
    } catch (err) {
        return res.status(500).send({
            message: 'Error initializing upload session.'
        })
    }
});

router.post('/upload-large/upload-chunk', chunkUpload.single('chunk'), (req, res) => {
    const index = parseInt(req.body.index);
    const totalChunks = parseInt(req.body.totalChunks);
    const sessionId = req.body.sessionId;
    
    if (index === totalChunks - 1) {
        mergeChunks(sessionId, totalChunks)
            .then(() => {
                res.status(200).send({
                    chunk: index,
                });
            })
            .catch(error => {
                console.error('Error merging chunks:', error);
                res.status(500).send('Error merging chunks');
            });
    } else {
        res.sendStatus(200);
    }
});

const mergeChunks = (sessionId, totalChunks) => {
    return new Promise((resolve, reject) => {
        const filename = Date.now();
        const writeStream = fs.createWriteStream(`uploads/${filename}`);
        let i = 0;
        
        writeStream.on('finish', () => {
            fs.rmdirSync(`uploads/temp`, { recursive: true });
            resolve();
        });
        
        writeStream.on('error', error => {
            reject(error);
        });

        const processChunk = () => {
            if (i < totalChunks) {
                const readStream = fs.createReadStream(`uploads/temp/${i}`);
                readStream.on('error', error => {
                    reject(error);
                });
                readStream.on('end', () => {
                    console.log(`Chunk ${i} complete.`);
                    i++;
                    processChunk();
                })
                readStream.pipe(writeStream, { end: false });
            } else {
                writeStream.end();
            }
        }
        processChunk();
    });
}


module.exports = router;
