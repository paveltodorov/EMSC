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
import matplotlib.pyplot as plt

import joblib
from sklearn.svm import NuSVC

filename = "EmscFullStats.xlsx"
# Read the Excel file into a DataFrame
data = pd.read_excel(filename)
runningOrderStats = pd.read_excel("Running Order Stats.xlsx")

# Remove rows where either the features or the target value is non-numerical
data = data[pd.to_numeric(data["Place Semi"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Running Final"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Place Final"], errors='coerce').notnull()]

data = pd.merge(data, runningOrderStats, on='Running Final', how='left')

# data = data[data["Country"] != "Malta"]

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
    ('model', LinearRegression()
    #  NuSVC(kernel = 'linear',gamma = 'scale', shrinking = False,)
     )
])

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=2)

# Fit the pipeline (preprocessing + model) to the training data
pipeline.fit(X_train, y_train)

# Evaluate the model
mse = pipeline.score(X_test, y_test)
print("Mean Squared Error:", mse)

predictions = pipeline.predict(X)

# Adding the predictions to the DataFrame
data["Predicted Place Final"] = predictions
data["Predicted Rank"] = data.groupby("Edition")["Predicted Place Final"].rank()
data["Difference"] = (data["Place Final"] - data["Predicted Rank"]).abs()

# Calculate the average of these differences
average_difference = data["Difference"].mean()
print("Average Absolute Difference:", average_difference)

data_sorted = data.sort_values(by=["Edition", "Predicted Rank"])
data = data.sort_values(by=["Edition","Predicted Place Final"])

print(data[["Country", "Name", "Place Semi", "Running Final", "Place Final", "Predicted Place Final", "Predicted Rank"]])

shortData = data[["Country", "Name", "Place Semi", "Running Final", "Place Final", "Predicted Place Final", "Predicted Rank", "Difference"]]
shortData.to_excel("predictions.xlsx")

joblib.dump(pipeline, 'trained_model1.pkl')

plt.scatter(data["Place Final"], data["Predicted Rank"], color="black")
# plt.plot(diabetes_X_test, diabetes_y_pred, color="blue", linewidth=3)

# This model is trying to predict how a song would score in the final based on the scores in the semifinal, how can I improve the model


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