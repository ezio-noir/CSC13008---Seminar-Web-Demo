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

          // Cập nhật danh sách file sau khi upload hoàn tất (thành công hoặc thất bại)
          fetch(`${apiBaseUrl}/files`)
            .then(response => response.json())
            .then(data => {
              fileList.empty(); // Xóa danh sách cũ
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

        } else {
          uploadStatus.text(data.error).addClass('text-danger');
        }
      })
      .catch(error => {
        console.error("Upload error:", error);
        uploadStatus.text("Upload failed: " + error.message).addClass('text-danger');
      });
  }
}

function displayFileContent(fileInfo) {
  const filePath = fileInfo.data('filePath');
  const fileType = fileInfo.data('fileType');

  // Tạo một modal Bootstrap để hiển thị nội dung file
  const modal = `
    <div class="modal fade" id="fileModal" tabindex="-1" aria-labelledby="fileModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="fileModalLabel">${fileInfo.text()}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body" id="fileModalContent">
            </div>
        </div>
      </div>
    </div>
  `;

  // Thêm modal vào DOM
  $('body').append(modal);

  // Lấy phần tử nội dung của modal
  const modalContent = $('#fileModalContent');

  // Kiểm tra loại file và hiển thị tương ứng
  if (fileType.startsWith('image/')) {
    // Hiển thị ảnh
    const img = new Image();
    img.src = filePath;
    img.classList.add('img-fluid'); // Thêm class để ảnh responsive
    modalContent.append(img);
  } else if (fileType.startsWith('video/')) {
    // Hiển thị video
    const video = document.createElement('video');
    video.src = filePath;
    video.controls = true;
    video.classList.add('w-100'); // Thêm class để video chiếm toàn bộ chiều rộng
    modalContent.append(video);
  } else if (fileType.startsWith('text/')) {
    // Hiển thị nội dung text
    fetch(filePath)
      .then(response => response.text())
      .then(textContent => {
        modalContent.text(textContent);
      });
  } else if (fileType === 'application/pdf') {
    // Hiển thị PDF (có thể cần thư viện hỗ trợ)
    // Gợi ý: Sử dụng thư viện pdf.js để hiển thị PDF
    // ...
  } else {
    // Xử lý các loại file khác hoặc thông báo không hỗ trợ
    modalContent.text('File type not supported');
  }

  // Hiển thị modal
  const fileModal = new bootstrap.Modal(document.getElementById('fileModal'));
  fileModal.show();
}

$("#fileList").on("click", "li", function () {
  const fileInfo = $(this); // Truyền trực tiếp jQuery object
  displayFileContent(fileInfo);
});