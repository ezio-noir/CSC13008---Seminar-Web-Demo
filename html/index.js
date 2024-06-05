function readURL(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const fileName = file.name;
      const fileType = file.type;
      $('#singleFileUpload .image-upload-wrap').hide();
      $('#singleFileUpload .file-upload-content').show();
      $('#singleFileUpload .image-title').html(fileName);
  
      if (fileType.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function (e) {
          $('#singleFileUpload .file-upload-image').attr('src', e.target.result);
          $('#singleFileUpload .file-upload-image').show();
        };
        reader.readAsDataURL(file);
      } else {
        $('#singleFileUpload .file-upload-image').hide();
      }
  
    } else {
      removeUpload();
    }
}

function removeUpload() {
  $('.file-upload-input').replaceWith($('.file-upload-input').clone());
  $('.file-upload-content').hide();
  $('.image-upload-wrap').show();
}
$('.image-upload-wrap').bind('dragover', function () {
  $('.image-upload-wrap').addClass('image-dropping');
});
$('.image-upload-wrap').bind('dragleave', function () {
  $('.image-upload-wrap').removeClass('image-dropping');
});
  
function uploadFiles() {
  const fileInput = $(".file-upload-input")[0];
  const fileList = $("#fileList");
  const uploadStatus = $("#uploadStatus");
  const apiBaseUrl = 'http://localhost:3001/api';

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch(`${apiBaseUrl}/upload-single`, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Upload failed with status ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.success) {
          const newListItem = $("<li>").addClass("list-group-item").text(file.name);
          newListItem.data('filePath', data.filePath);
          newListItem.data('fileType', file.type);
          fileList.append(newListItem);
          uploadStatus.text("Successfully uploaded").addClass("text-success");
          removeUpload();
        } else {
          uploadStatus.text("Upload failed: " + (data.error || "Unknown error")).addClass('text-danger');
        }
        // updateFileList();
      })
      .catch(error => {
        console.error("Upload error:", error);
        uploadStatus.text("Upload failed: " + error.message).addClass('text-danger');
        // updateFileList();
      });
  }
}
  
// Hàm cập nhật danh sách file
function updateFileList() {
  const fileList = $("#fileList");
  const apiBaseUrl = 'http://localhost:3001';

  fetch(`${apiBaseUrl}/files`)
    .then(response => response.json())
    .then(data => {
      fileList.empty();
      data.forEach(file => {
        const newListItem = $("<li>").addClass("list-group-item").text(file.originalName);
        newListItem.data('filePath', file.path);
        newListItem.data('fileType', file.type);
        fileList.append(newListItem);
      });
    })
    .catch(error => {
      console.error("Error fetching file list:", error);
    });
}

// Gọi hàm cập nhật danh sách file khi trang web được tải
// $(document).ready(updateFileList);

function readMultipleFiles(input) {
  if (input.files && input.files.length > 0) {
    $('#multipleFileUpload .image-upload-wrap').hide();
    $('#multipleFileUpload .file-upload-content').show();
    $('#multipleFileUpload .image-title').html(`${input.files.length} files selected`);
  } else {
    removeMultipleUpload();
  }
}

function removeMultipleUpload() {
  $('#multipleFileUpload .file-upload-input').replaceWith($('#multipleFileUpload .file-upload-input').clone());
  $('#multipleFileUpload .file-upload-content').hide();
  $('#multipleFileUpload .image-upload-wrap').show();
}

function uploadMultipleFiles() {
  const fileInput = $("#multipleFileUpload .file-upload-input")[0]; // Lấy input từ layout multiple
  const fileList = $("#fileList");
  const uploadStatus = $("#uploadStatus");
  const apiBaseUrl = 'http://localhost:3001/api';

  if (fileInput.files.length > 0) {
    const formData = new FormData();
    for (const file of fileInput.files) {
      formData.append('files', file);
    }

    fetch(`${apiBaseUrl}/upload-multiple`, { // Gọi API uploadMultiple
      method: 'POST',
      body: formData
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          data.filePaths.forEach(filePath => {
            const fileName = filePath.split('/').pop();
            const newListItem = $("<li>").addClass("list-group-item").text(fileName);
            newListItem.data('filePath', filePath);
            fileList.append(newListItem);
          });
          uploadStatus.text("Successfully uploaded").addClass("text-success");
          removeMultipleUpload(); // Xóa nội dung sau khi upload thành công
        } else {
          uploadStatus.text("Upload failed: " + (data.error || "Unknown error")).addClass('text-danger');
        }
        // updateFileList();
      })
      .catch(error => {
        console.error("Upload error:", error);
        uploadStatus.text("Upload failed: " + error.message).addClass('text-danger');
        // updateFileList();
      });
  }
}

const showChunkForm = (input) => {
  const file = input.files[0];
  const chunkSize = 1024 * 1024 * 10;
  const totalChunks = Math.ceil(file.size / chunkSize);

  if (input.files && input.files.length > 0) {
    $('#largeFileUpload .image-upload-wrap').hide();
    $('#largeFileUpload .file-upload-content').show();
    $('#largeFileUpload .image-title').html(`${input.files.length} files selected`);
  }

  console.log(totalChunks);
}

function removeLargeFileUload() {
  $('#largeFileUpload .file-upload-input').replaceWith($('#largeFileUpload .file-upload-input').clone());
  $('#largeFileUpload .file-upload-content').hide();
  $('#largeFileUpload .image-upload-wrap').show();
}


const uploadResumable = async () => {
  const startChunk = parseInt(document.getElementById('startChunk').value) || 0;
  const endChunk = parseInt(document.getElementById('endChunk').value) || 9999;
  const fileInput = document.getElementById('largeFileInput');
  const file = fileInput.files[0];
  const chunkSize = 1024 * 1024 * 10;
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  const initResponse = await fetch('http://localhost:3001/api/upload-large/init', {
    method: 'POST',
  });
  if (!initResponse.ok) {
    console.error('Error initializing upload');
    return;
  }
  const initResult = await initResponse.json();
  const sessionId = initResult.sessionId;
  let countUploaded = 0;

  for (let i = startChunk; i < Math.min(totalChunks, endChunk); ++i) {
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('index', i);
    formData.append('sessionId', sessionId);
    formData.append('totalChunks', totalChunks);
    formData.append('chunk', chunk);

    try {
      const response = await fetch('http://localhost:3001/api/upload-large/upload-chunk', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        throw new Error('Error uploading chunk' + i);
      }
      ++countUploaded;
      console.log(countUploaded);
    } catch (err) {
      console.error('Error uploading chunk:', err);
    }
  }
}