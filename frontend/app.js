document.addEventListener('DOMContentLoaded', () => {
    const imageInput = document.getElementById('imageInput');
    const predictButton = document.getElementById('predictButton');
    const imagePreview = document.getElementById('imagePreview');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const resultContainer = document.getElementById('resultContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const resultText = document.getElementById('resultText');
    const confidenceText = document.getElementById('confidenceText');
    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');

    // Function to display error messages
    const displayError = (message) => {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
        resultContainer.classList.add('hidden'); // Hide results if error
    };

    // Function to hide error messages
    const hideError = () => {
        errorContainer.classList.add('hidden');
        errorMessage.textContent = '';
    };

    // Image preview logic
    imageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
            hideError(); // Clear any previous errors
            resultContainer.classList.add('hidden'); // Hide previous results
            loadingIndicator.classList.add('hidden'); // Hide loading indicator
        } else {
            imagePreviewContainer.classList.add('hidden');
            imagePreview.src = '';
        }
    });

    predictButton.addEventListener('click', async () => {
        const file = imageInput.files[0];
        
        hideError(); // Clear previous errors
        resultContainer.classList.add('hidden'); // Hide previous results
        
        if (!file) {
            displayError("Please select an image file before predicting.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        resultContainer.classList.remove('hidden'); // Show container for loading
        resultText.textContent = '';
        confidenceText.textContent = '';
        
        try {
            // Using the service name 'backend' defined in docker-compose.yml
            // This works when the frontend container communicates with the backend container
            // If running directly on host, use 'http://localhost:5000/predict'
            const response = await fetch('http://localhost:5000/predict', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Hide loading indicator
            loadingIndicator.classList.add('hidden');
            
            if (data.error) {
                displayError(`Backend Error: ${data.error}`);
            } else {
                const confidence = (data.confidence * 100).toFixed(2);
                resultText.textContent = `Predicted Label: ${data.label}`;
                confidenceText.textContent = `Confidence: ${confidence}%`;
                resultContainer.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Prediction failed:', error);
            // Hide loading indicator even on error
            loadingIndicator.classList.add('hidden');
            displayError(`Prediction failed. Please try again. Details: ${error.message}`);
        }
    });
});