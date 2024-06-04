const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;
const cors = require('cors');
app.use(cors({
    origin: '*', // Cho phép yêu cầu từ cổng 5500
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true // Cho phép gửi cookie và xác thực HTTP
}));

const dataFilePath = path.join(__dirname, 'uploadedFiles.json');

// Đọc dữ liệu từ file JSON (hoặc khởi tạo nếu chưa có)
let uploadedFiles = [];
try {
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    if (data) {
        uploadedFiles = JSON.parse(data);
    }
} catch (err) {
    if (err.code !== 'ENOENT') {
        console.error('Error reading data file:', err);
    }
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.static(__dirname));
// cấu hình để đọc dữ liệu gửi lên theo phương thức POST
app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// API upload file
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, error: 'No file uploaded.' });
    }

    try {
        // Lưu thông tin file vào mảng
        uploadedFiles.push({
            name: req.file.filename,
            originalName: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            type: req.file.mimetype
        });

        // Ghi dữ liệu vào file JSON
        fs.writeFileSync(dataFilePath, JSON.stringify(uploadedFiles, null, 2));

        res.json({ success: true, filePath: `/uploads/${req.file.filename}` });
    } catch (err) {
        console.error('Error saving file data:', err);
        res.status(500).json({ success: false, error: 'Error saving file data' });
    }
});

// API lấy danh sách file đã upload
app.get('/files', (req, res) => {
    res.json(uploadedFiles);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
