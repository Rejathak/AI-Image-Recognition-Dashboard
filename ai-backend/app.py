import tensorflow as tf
from flask import Flask, request, jsonify
from PIL import Image
import numpy as np
from flask_cors import CORS # Import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Load your pre-trained model (e.g., MobileNetV2)
model = tf.keras.applications.MobileNetV2(weights='imagenet')

def process_image(image):
    # MobileNetV2 expects 224x224 images
    image = image.resize((224, 224))
    image_array = tf.keras.preprocessing.image.img_to_array(image)
    image_array = tf.keras.applications.mobilenet_v2.preprocess_input(image_array)
    return np.expand_dims(image_array, axis=0)

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    image = Image.open(file.stream)

    processed_image = process_image(image)
    predictions = model.predict(processed_image)

    # Decode the prediction
    decoded_predictions = tf.keras.applications.mobilenet_v2.decode_predictions(predictions, top=1)
    top_prediction = decoded_predictions[0][0]

    result = {
        'label': top_prediction[1],
        'confidence': float(top_prediction[2])
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)