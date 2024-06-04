const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Cấu hình CORS (cho phép tất cả các origin trong ví dụ này)
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'], // Chỉ cho phép các phương thức cần thiết
    allowedHeaders: ['Content-Type', 'Authorization'] // Chỉ định header được phép
}));

const dataFilePath = path.join(__dirname, 'uploadedFiles.json');
const uploadDirectory = path.join(__dirname, 'uploads');

// Đảm bảo thư mục uploads tồn tại
fs.mkdirSync(uploadDirectory, { recursive: true }); // Tạo thư mục nếu chưa có

// Đọc dữ liệu từ file JSON
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

// Cấu hình Multer
const storage = multer.diskStorage({
    destination: uploadDirectory, // Sử dụng đường dẫn tuyệt đối
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 500 }
});

// Cấu hình middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(uploadDirectory)); // Phục vụ file tĩnh từ thư mục uploads

// API upload file
app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded.' });
        }

        uploadedFiles.push({
            name: req.file.filename,
            originalName: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            type: req.file.mimetype
        });

        fs.writeFileSync(dataFilePath, JSON.stringify(uploadedFiles, null, 2));
        res.json({ success: true, filePath: `/uploads/${req.file.filename}` });

    } catch (err) {
        console.error('Error uploading file:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API upload nhiều file
app.post('/uploadMultiple', upload.array('files'), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, error: 'No files uploaded.' });
        }

        const filePaths = [];
        req.files.forEach(file => {
            uploadedFiles.push({
                name: file.filename,
                originalName: file.originalname,
                path: `/uploads/${file.filename}`,
                type: file.mimetype
            });
            filePaths.push(`/uploads/${file.filename}`);
        });

        fs.writeFileSync(dataFilePath, JSON.stringify(uploadedFiles, null, 2));
        res.json({ success: true, filePaths: filePaths });
    } catch (err) {
        console.error('Error uploading files:', err);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API lấy danh sách file
app.get('/files', (req, res) => {
    res.json(uploadedFiles);
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});