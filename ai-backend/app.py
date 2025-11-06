import tensorflow as tf
from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
from flask_cors import CORS
from scipy.spatial.distance import cosine # Import cosine

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# --- Model Loading ---
# We load TWO models
# 1. The full model for getting labels (e.g., "wolf")
full_model = tf.keras.applications.MobileNetV2(weights='imagenet')

# 2. The base model (no top layer) for feature extraction
# We use 'avg' pooling to get a single vector per image
base_model = tf.keras.applications.MobileNetV2(weights='imagenet', include_top=False, pooling='avg')

# --- Helper Functions ---

def process_image(image):
    # MobileNetV2 expects 224x224 images
    image = image.resize((224, 224))
    image_array = tf.keras.preprocessing.image.img_to_array(image)
    image_array = tf.keras.applications.mobilenet_v2.preprocess_input(image_array)
    return np.expand_dims(image_array, axis=0)

def get_prediction_label_and_confidence(image, model):
    """
    Uses the full classification model to get a label and confidence.
    """
    processed_image = process_image(image)
    predictions = model.predict(processed_image)
    
    # Decode the prediction
    decoded_predictions = tf.keras.applications.mobilenet_v2.decode_predictions(predictions, top=1)
    top_prediction = decoded_predictions[0][0]

    result = {
        'label': top_prediction[1],
        'confidence': float(top_prediction[2])
    }
    return result

def get_feature_vector(image, model):
    """
    Uses the base model to extract a feature vector (fingerprint).
    """
    processed_image = process_image(image)
    features = model.predict(processed_image)
    return features.flatten() # Flatten to a 1D array

# --- Main Prediction Route ---

@app.route('/predict', methods=['POST'])
def predict():
    if 'file1' not in request.files or 'file2' not in request.files:
        return jsonify({'error': 'Two files are required'}), 400

    file1 = request.files['file1']
    file2 = request.files['file2']

    try:
        image1 = Image.open(file1.stream)
        image2 = Image.open(file2.stream)
    except Exception as e:
        return jsonify({'error': f'Invalid image file: {str(e)}'}), 400

    # --- Get Labels (like before) ---
    # We use .copy() to ensure the file stream isn't consumed
    result1 = get_prediction_label_and_confidence(image1.copy(), full_model)
    result2 = get_prediction_label_and_confidence(image2.copy(), full_model)

    # --- Get Feature Vectors (New) ---
    features1 = get_feature_vector(image1.copy(), base_model)
    features2 = get_feature_vector(image2.copy(), base_model)

    # --- Calculate Similarity (New) ---
    # Cosine distance is 0 for identical, 1 for opposite.
    # Cosine similarity is 1 - distance.
    similarity_score = 1 - cosine(features1, features2)
    
    analysis_text = f"The images are {similarity_score*100:.2f}% similar."
    if result1['label'] == result2['label'] and similarity_score > 0.8:
        analysis_text += f" Both are identified as '{result1['label']}'."
    elif similarity_score > 0.8:
        analysis_text += f" They are visually similar, but identified as '{result1['label']}' and '{result2['label']}'."
    else:
        analysis_text += f" They are identified as '{result1['label']}' and '{result2['label']}'."

    final_result = {
        'image1_result': result1,
        'image2_result': result2,
        'comparison': {
            'similarity_score': float(similarity_score),
            'analysis': analysis_text
        }
    }

    return jsonify(final_result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)