import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.svm import SVR
from sklearn.metrics import mean_squared_error
import joblib

# Load the data
filename = "EmscFullStats.xlsx"
data = pd.read_excel(filename)

# Data preprocessing: Remove rows where any key features are non-numerical
data = data[pd.to_numeric(data["Place Semi"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Running Final"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Place Final"], errors='coerce').notnull()]

# Fill any missing values in Points Semi, Place Semi, Running Semi
data = data.fillna(method='ffill').fillna(method='bfill')

# Extract features and target variable
X = data[[
    "Points Semi",
    "Place Semi",
    "Running Final",
    "Running Semi",
    "Sum Top3 Pts Semi",
    "Sum Top5 Pts Semi",
    "Country"
]]
y = data["Place Final"]

# Preprocessing pipeline
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), [
            "Points Semi",
            "Place Semi",
            "Running Semi",
            "Sum Top3 Pts Semi",
            "Sum Top5 Pts Semi"
        ]),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ["Running Final", "Country"])
    ],
    remainder='passthrough'
)

# Define the model pipeline with SVR
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', SVR())
])

# Set up grid search for hyperparameter tuning
param_grid = {
    'model__C': [0.1, 1, 10],
    'model__epsilon': [0.1, 0.2, 0.5],
    'model__kernel': ['linear', 'rbf']
}

grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='neg_mean_squared_error', n_jobs=-1)
grid_search.fit(X, y)

# Get the best pipeline
best_pipeline = grid_search.best_estimator_
print("Best parameters found:", grid_search.best_params_)
print("Best score found:", grid_search.best_score_)

# Save the trained model
joblib.dump(best_pipeline, 'svr_model.pkl')

# Load new data for prediction
filenameOther = "Emsc2404Semis.xlsx"
new_data = pd.read_excel(filenameOther)

# Predict the final placements using the trained model
predictions = best_pipeline.predict(new_data[X.columns])

# Add predictions to the new data DataFrame
new_data["Predicted Place Final"] = predictions
new_data["Predicted Rank"] = new_data["Predicted Place Final"].rank()
new_data["Difference"] = (new_data["Place Final"] - new_data["Predicted Rank"]).abs()

new_data = new_data.sort_values(by=["Edition","Predicted Place Final"])

# Calculate the average of these differences
average_difference = new_data["Difference"].mean()
print("Average Absolute Difference:", average_difference)

# Save the results
new_data.to_excel("predictions_EMSC2404Semis_SVR.xlsx", index=False)

# Print key columns for review
print(new_data[["Country", "Name", "Place Semi", "Running Final", "Place Final", "Predicted Place Final", "Predicted Rank"]])
