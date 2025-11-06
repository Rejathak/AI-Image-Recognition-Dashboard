document.addEventListener('DOMContentLoaded', () => {
    
    // --- Get Elements ---
    const imageInput1 = document.getElementById('imageInput1');
    const imageInput2 = document.getElementById('imageInput2');
    const predictButton = document.getElementById('predictButton');
    
    const imagePreview1 = document.getElementById('imagePreview1');
    const imagePreviewContainer1 = document.getElementById('imagePreviewContainer1');
    const imagePreview2 = document.getElementById('imagePreview2');
    const imagePreviewContainer2 = document.getElementById('imagePreviewContainer2');
    
    const resultContainer = document.getElementById('resultContainer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // Result fields
    const result1Text = document.getElementById('result1Text');
    const confidence1Text = document.getElementById('confidence1Text');
    const result2Text = document.getElementById('result2Text');
    const confidence2Text = document.getElementById('confidence2Text');
    const similarityScoreText = document.getElementById('similarityScoreText');
    const analysisText = document.getElementById('analysisText');

    const errorContainer = document.getElementById('errorContainer');
    const errorMessage = document.getElementById('errorMessage');

    // --- Error Handling ---
    const displayError = (message) => {
        errorMessage.textContent = message;
        errorContainer.classList.remove('hidden');
        resultContainer.classList.add('hidden'); // Hide results if error
    };

    const hideError = () => {
        errorContainer.classList.add('hidden');
        errorMessage.textContent = '';
    };

    // --- Image Preview Logic (Helper) ---
    const setupImagePreview = (inputElement, previewElement, containerElement) => {
        inputElement.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewElement.src = e.target.result;
                    containerElement.classList.remove('hidden');
                };
                reader.readAsDataURL(file);
                hideError(); // Clear any previous errors
                resultContainer.classList.add('hidden'); // Hide previous results
            } else {
                containerElement.classList.add('hidden');
                previewElement.src = '';
            }
        });
    };

    // Setup previews for both inputs
    setupImagePreview(imageInput1, imagePreview1, imagePreviewContainer1);
    setupImagePreview(imageInput2, imagePreview2, imagePreviewContainer2);

    // --- Predict Button Logic ---
    predictButton.addEventListener('click', async () => {
        const file1 = imageInput1.files[0];
        const file2 = imageInput2.files[0];
        
        hideError(); // Clear previous errors
        resultContainer.classList.add('hidden'); // Hide previous results
        
        if (!file1 || !file2) {
            displayError("Please select two image files before comparing.");
            return;
        }

        const formData = new FormData();
        formData.append('file1', file1);
        formData.append('file2', file2);

        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        resultContainer.classList.remove('hidden'); // Show container for loading
        
        // Clear old results
        result1Text.textContent = '';
        confidence1Text.textContent = '';
        result2Text.textContent = '';
        confidence2Text.textContent = '';
        similarityScoreText.textContent = '';
        analysisText.textContent = '';
        
        try {
            // Using localhost:5000 as defined in docker-compose.yml
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
                // Populate all the new result fields
                
                // Image 1
                result1Text.textContent = `Predicted Label: ${data.image1_result.label}`;
                confidence1Text.textContent = `Confidence: ${(data.image1_result.confidence * 100).toFixed(2)}%`;
                
                // Image 2
                result2Text.textContent = `Predicted Label: ${data.image2_result.label}`;
                confidence2Text.textContent = `Confidence: ${(data.image2_result.confidence * 100).toFixed(2)}%`;

                // Comparison
                similarityScoreText.textContent = `Similarity Score: ${(data.comparison.similarity_score * 100).toFixed(2)}%`;
                analysisText.textContent = `Analysis: ${data.comparison.analysis}`;
                
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