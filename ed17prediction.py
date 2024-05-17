import pandas as pd
from sklearn.linear_model import LinearRegression
import joblib

# Read the Excel file into a DataFrame
filename = "EmscFullStats.xlsx"
data = pd.read_excel(filename)
runningOrderStats = pd.read_excel("Running Order Stats.xlsx")

# Filter the data to include only rows where Edition equals 17
data_17 = data[data["Edition"] == 4]

# Remove rows where either the features or the target value is non-numeric
data_17 = data_17[pd.to_numeric(data_17["Place Semi"], errors='coerce').notnull()]
data_17 = data_17[pd.to_numeric(data_17["Running Final"], errors='coerce').notnull()]

data_17 = pd.merge(data_17, runningOrderStats, on='Running Final', how='left')

# Extracting features
X_17 = data_17[[
    "Points Semi",
    "Place Semi",
    "Running Final",
    "Running Semi",
    "Avg Position",
    "Country"
]]  # Features

# Load the trained model (assuming 'model' is already trained)
model = joblib.load('trained_model1.pkl')

# Making predictions for Edition 17
predictions_17 = model.predict(X_17)

# Adding the predictions to the DataFrame
data_17["Predicted Place Final"] = predictions_17

data_17_sorted = data_17.sort_values(by="Predicted Place Final")

# Print the predictions
print(data_17_sorted[["Country", "Name", "Place Semi", "Running Final", "Place Final", "Predicted Place Final"]])