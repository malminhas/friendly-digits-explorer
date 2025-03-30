#!/bin/bash

# Create data directory if it doesn't exist
mkdir -p public/data

# Download MNIST dataset files from GitHub
cd public/data

# Training set
curl -L -o train-images.idx3-ubyte https://raw.githubusercontent.com/mrgloom/MNIST-dataset-in-different-formats/master/data/Original%20dataset/train-images.idx3-ubyte
curl -L -o train-labels.idx1-ubyte https://raw.githubusercontent.com/mrgloom/MNIST-dataset-in-different-formats/master/data/Original%20dataset/train-labels.idx1-ubyte

# Test set
curl -L -o t10k-images.idx3-ubyte https://raw.githubusercontent.com/mrgloom/MNIST-dataset-in-different-formats/master/data/Original%20dataset/t10k-images.idx3-ubyte
curl -L -o t10k-labels.idx1-ubyte https://raw.githubusercontent.com/mrgloom/MNIST-dataset-in-different-formats/master/data/Original%20dataset/t10k-labels.idx1-ubyte

echo "MNIST dataset downloaded successfully!" 