import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline

import joblib

filename = "EmscFullStats.xlsx"
# Read the Excel file into a DataFrame
data = pd.read_excel(filename)
runningOrderStats = pd.read_excel("Running Order Stats.xlsx")

# Remove rows where either the features or the target value is non-numerical
data = data[pd.to_numeric(data["Place Semi"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Running Final"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Place Final"], errors='coerce').notnull()]

data = pd.merge(data, runningOrderStats, on='Running Final', how='left')

# Extracting features and target variable
X = data[[
    "Points Semi",
    "Place Semi",
    "Running Final",
    "Running Semi",
    "Avg Position",
    "Country",
    # "HOD",
    # "SF"
]]  # Features
# X[:2] = runningOrderStats
y = data["Place Final"]  # Target variable

# linear regression
# Splitting the data into training and testing sets
# X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# # Initializing and training the linear regression model
# model = LinearRegression()
# model.fit(X_train, y_train)

# # Making predictions on the test set
# y_pred = model.predict(X_test)
# joblib.dump(model, 'trained_model.pkl')

# # Evaluating the model
# mse = mean_squared_error(y_test, y_pred)
# print("Mean Squared Error:", mse)

# Define column transformer for preprocessing
# Numeric features will be scaled, categorical features will be one-hot encoded
preprocessor = ColumnTransformer(
    transformers=[
        ('num', StandardScaler(), ["Points Semi", "Place Semi", "Running Semi"]),
        ('cat', OneHotEncoder(handle_unknown='ignore'),
            [
             "Running Final",
             "Country",
            #  "SF"
               #"HOD"#
            ])
    ],
    remainder='passthrough'
)

# Define the pipeline with preprocessing and model
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', LinearRegression())
])

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Fit the pipeline (preprocessing + model) to the training data
pipeline.fit(X_train, y_train)

# Evaluate the model
mse = pipeline.score(X_test, y_test)
print("Mean Squared Error:", mse)

joblib.dump(pipeline, 'trained_model1.pkl')