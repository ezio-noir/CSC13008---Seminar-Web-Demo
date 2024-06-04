function readURL(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const fileName = file.name;
    const fileType = file.type;
    $('.image-upload-wrap').hide();
    $('.file-upload-content').show();
    $('.image-title').html(fileName);

    if (fileType.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $('.file-upload-image').attr('src', e.target.result);
        $('.file-upload-image').show();
      };
      reader.readAsDataURL(file);
    } else {
      $('.file-upload-image').hide();
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
  const apiBaseUrl = 'http://localhost:3000';

  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch(`${apiBaseUrl}/upload`, {
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
          uploadStatus.text("Upload failed: " + (data.error || "Unknown error")).addClass('text-danger'); // Hiển thị thông báo lỗi từ server (nếu có)
        }
        updateFileList(); // Cập nhật danh sách file sau khi upload
      })
      .catch(error => {
        console.error("Upload error:", error);
        uploadStatus.text("Upload failed: " + error.message).addClass('text-danger');
        updateFileList(); // Cập nhật danh sách file sau khi upload
      });
  }
}

// Hàm cập nhật danh sách file
function updateFileList() {
  const fileList = $("#fileList");
  const apiBaseUrl = 'http://localhost:3000';

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
$(document).ready(updateFileList);

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
  const apiBaseUrl = 'http://localhost:3000';

  if (fileInput.files.length > 0) {
    const formData = new FormData();
    for (const file of fileInput.files) {
      formData.append('files', file);
    }

    fetch(`${apiBaseUrl}/uploadMultiple`, { // Gọi API uploadMultiple
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
        updateFileList();
      })
      .catch(error => {
        console.error("Upload error:", error);
        uploadStatus.text("Upload failed: " + error.message).addClass('text-danger');
        updateFileList();
      });
  }
}