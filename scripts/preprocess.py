import numpy as np

def preprocess_image(image_path):
    print(f"Preprocessing {image_path}")
    return np.zeros((256, 256))  # Simulated preprocessed image

if __name__ == "__main__":
    image_path = input("Enter image path: ")
    processed = preprocess_image(image_path)
    print("Image preprocessed")