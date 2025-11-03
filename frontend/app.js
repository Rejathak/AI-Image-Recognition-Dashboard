document.getElementById('predictButton').addEventListener('click', () => {
    const fileInput = document.getElementById('imageInput');
    const resultDiv = document.getElementById('result');

    if (fileInput.files.length === 0) {
        alert("Please select a file!");
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    resultDiv.textContent = 'Analyzing...';

    // This URL points to the backend service we will define in Docker Compose
    fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            resultDiv.textContent = `Error: ${data.error}`;
        } else {
            const confidence = (data.confidence * 100).toFixed(2);
            resultDiv.textContent = `Result: ${data.label} (${confidence}%)`;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        resultDiv.textContent = 'Prediction failed. Is the backend running?';
    });
});