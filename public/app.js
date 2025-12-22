const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const optimizeBtn = document.getElementById('optimizeBtn');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const qualitySlider = document.getElementById('quality');
const qualityValue = document.getElementById('qualityValue');
const widthSlider = document.getElementById('maxWidth');
const widthValue = document.getElementById('widthValue');

let selectedFile = null;
let optimizedBlob = null;

// Update slider values
qualitySlider.addEventListener('input', (e) => {
    qualityValue.textContent = e.target.value + '%';
});

widthSlider.addEventListener('input', (e) => {
    widthValue.textContent = e.target.value + 'px';
});

// Click to upload
uploadArea.addEventListener('click', () => fileInput.click());

// Drag and drop
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    if (!file.type.match('image/(jpeg|png|webp)')) {
        alert('Format file tidak didukung. Gunakan JPG, PNG, atau WebP.');
        return;
    }

    if (file.size > 20 * 1024 * 1024) {
        alert('Ukuran file terlalu besar. Maksimal 20MB.');
        return;
    }

    selectedFile = file;
    optimizeBtn.disabled = false;
    optimizeBtn.textContent = `Optimasi ${file.name}`;
    result.classList.remove('show');
}

// Optimize button
optimizeBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('quality', qualitySlider.value);
    formData.append('maxWidth', widthSlider.value);
    formData.append('format', document.getElementById('format').value);

    loading.classList.add('show');
    result.classList.remove('show');
    optimizeBtn.disabled = true;

    try {
        const response = await fetch('/api/optimize', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error('Optimasi gagal');
        }

        const blob = await response.blob();
        const data = JSON.parse(response.headers.get('X-Image-Stats'));

        optimizedBlob = blob;

        document.getElementById('originalSize').textContent = data.originalSize;
        document.getElementById('optimizedSize').textContent = data.optimizedSize;
        document.getElementById('reduction').textContent = data.reduction + '%';

        result.classList.add('show');
        result.classList.remove('error');

    } catch (error) {
        result.classList.add('show', 'error');
        result.querySelector('h3').textContent = '❌ Optimasi Gagal';
        console.error('Error:', error);
    } finally {
        loading.classList.remove('show');
        optimizeBtn.disabled = false;
    }
});

// Download button
document.getElementById('downloadBtn').addEventListener('click', () => {
    if (!optimizedBlob) return;

    const url = URL.createObjectURL(optimizedBlob);
    const a = document.createElement('a');
    a.href = url;
    const format = document.getElementById('format').value;
    const originalName = selectedFile.name.split('.')[0];
    a.download = `${originalName}-optimized.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});
