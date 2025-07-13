import pandas as pd
from sklearn import svm
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error

from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import AdaBoostClassifier, HistGradientBoostingClassifier
from sklearn.impute import SimpleImputer
import matplotlib.pyplot as plt

import joblib
from sklearn.svm import NuSVC

filename = "EmscFullStats.xlsx"
editionToPredictFileName = "EMSC2502-Summary.xlsx"
# Read the Excel file into a DataFrame
data = pd.read_excel(filename)
print(data.columns)
runningOrderStats = pd.read_excel("Running Order Stats.xlsx")
hodStats = pd.read_excel("EMSC-HoD-Country-Ranking.xlsx")

# Remove rows where either the features or the target value is non-numerical
data = data[pd.to_numeric(data["Place Semi"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Running Final"], errors='coerce').notnull()]
data = data[pd.to_numeric(data["Place Final"], errors='coerce').notnull()]
# data = data[pd.to_numeric(data["Sum Top3 Pts Semi"], errors='coerce').notnull()]
# data = data[pd.to_numeric(data["Sum Top5 Pts Semi"], errors='coerce').notnull()]

data = data.sort_values(by=['Edition', 'SF', 'Running Semi'])
data['Previous Place Semi'] = data.groupby(['Edition', 'SF'])['Place Semi'].shift(1)
# data['Previous Running Semi'] = data.groupby(['Edition', 'SF'])['Running Semi'].shift(1)
data['Previous Points Semi'] = data.groupby(['Edition', 'SF'])['Points Semi'].shift(1)

data['Next Place Semi'] = data.groupby(['Edition', 'SF'])['Place Semi'].shift(-1)
# data['Next Running Semi'] = data.groupby(['Edition', 'SF'])['Running Semi'].shift(-1)
data['Next Points Semi'] = data.groupby(['Edition', 'SF'])['Points Semi'].shift(-1)

data['Previous Place Semi'] = data['Previous Place Semi'].fillna(method='ffill').fillna(method='bfill')
data['Previous Points Semi'] = data['Previous Points Semi'].fillna(method='ffill').fillna(method='bfill')
data['Next Place Semi'] = data['Next Place Semi'].fillna(method='ffill').fillna(method='bfill')
data['Next Points Semi'] = data['Next Points Semi'].fillna(method='ffill').fillna(method='bfill')

# data = pd.merge(data, runningOrderStats, on='Running Final', how='left')
# data = pd.merge(data, hodStats, on='HOD', how='left')

# print(data)

# data = data[data["Country"] != "Malta"]

# Extracting features and target variable
X = data[[
    "Points Semi",
    "Place Semi",
    "Running Final",
    "Running Semi",
    # "Avg Position",
    "Country",
    "Sum Top3 Pts Semi",
    "Sum Top5 Pts Semi",
    # "HOD",
    # "Previous Place Semi",
    # "Next Place Semi",
    # "Previous Points Semi",
    # "Next Points Semi",
    # "Num Of Indiv Votes Semi",
    # "Average"
    # "SF"
]]  # Features
# X[:2] = runningOrderStats
y = data["Place Final"]  # Target variable
# data.to_excel("inout.xlsx")

# Define column transformer for preprocessing
# Numeric features will be scaled, categorical features will be one-hot encoded
preprocessor = ColumnTransformer(
    transformers=[
        # ('num', StandardScaler(), ["Points Semi", "Place Semi", "Running Semi",
            # "Previous Place Semi",
            # "Next Place Semi",
            # "Previous Points Semi",
            # "Next Points Semi",
            # "Num Of Indiv Votes Semi",
        # ]),
        ('num', StandardScaler(), [
            "Points Semi",
            "Place Semi",
            "Running Semi",
            # "Sum Top3 Pts Semi",
            # "Sum Top5 Pts Semi",
        ]),
        ('cat', OneHotEncoder(handle_unknown='ignore'), ["Running Final", "Country"])
        # ('cat2', OneHotEncoder(handle_unknown='ignore'), ["HOD"]),
        # ('cat3', OneHotEncoder(handle_unknown='ignore'), ["Country"])
    ],
    remainder='passthrough'
)

# Define the pipeline with preprocessing and model
pipeline = Pipeline([
    ('preprocessor', preprocessor),
    ('model', LinearRegression())
    #  NuSVC(kernel = 'linear',gamma = 'scale', shrinking = False,)
    # svm.SVC(kernel='linear', C=1)
])

# Split the data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)

# Fit the pipeline (preprocessing + model) to the training data
pipeline.fit(X_train, y_train)

# Evaluate the model
mse = pipeline.score(X_test, y_test)
print("Mean Squared Error:", mse)

data = pd.read_excel(editionToPredictFileName)
predictions = pipeline.predict(data) # X
# Adding the predictions to the DataFrame
data["Predicted Place Final"] = predictions
data["Predicted Rank"] = data.groupby("Edition")["Predicted Place Final"].rank()
data["Difference"] = (data["Place Final"] - data["Predicted Rank"]).abs()

# Calculate the average of these differences
average_difference = data["Difference"].mean()
print("Average Absolute Difference:", average_difference)

data_sorted = data.sort_values(by=["Edition", "Predicted Rank"])
data = data.sort_values(by=["Edition","Predicted Place Final"])

print(data[["Country",
            "Name", "Place Semi", "Running Final", "Place Final",
            "Predicted Place Final",
            "Predicted Rank"
            ]])

shortData = data[
    ["Country",
     "Artist", "Song", "Name", "Place Semi", "Running Final", "Place Final",
     "Predicted Place Final",
     "Predicted Rank", "Difference"
     ]]
shortData.to_excel("predictions.xlsx")

joblib.dump(pipeline, 'trained_model1.pkl')


# from sklearn.model_selection import GridSearchCV
# from sklearn.ensemble import RandomForestRegressor

# # Define the pipeline with preprocessing and model
# pipeline = Pipeline([
#     ('preprocessor', preprocessor),
#     ('model', RandomForestRegressor(random_state=0))
# ])

# # Define parameter grid for hyperparameter tuning
# param_grid = {
#     'model__n_estimators': [50, 100, 200],
#     'model__max_depth': [None, 10, 20, 30],
#     'model__min_samples_split': [2, 5, 10],
#     'model__min_samples_leaf': [1, 2, 4]
# }

# # Perform Grid Search with cross-validation
# grid_search = GridSearchCV(pipeline, param_grid, cv=5, scoring='neg_mean_squared_error', n_jobs=-1)
# grid_search.fit(X_train, y_train)

# print("Best parameters found:", grid_search.best_params_)
# print("Best score found:", grid_search.best_score_)

# from sklearn.compose import ColumnTransformer
# from sklearn.preprocessing import StandardScaler, OneHotEncoder

# # Assuming you have your pipeline with 'preprocessor' step
# preprocessor = best_pipeline.named_steps['preprocessor']

# # Extract feature names from the transformers
# num_features = preprocessor.transformers_[0][1].get_feature_names_out()
# cat_features = preprocessor.transformers_[1][1].get_feature_names_out()

# # Combine feature names
# all_feature_names = num_features.tolist() + cat_features.tolist()

# # Print feature names
# print("Feature Names:")
# print(all_feature_names)

# # Extract feature importances from the model
# importances = best_pipeline.named_steps['model'].feature_importances_

# # Combine feature names with importances
# feature_importances = sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)

# print("Feature Importances:")
# for feature, importance in feature_importances:
#     print(f"{feature}: {importance}")

# y_pred = best_pipeline.predict(X_test)
# residuals = y_test - y_pred

# plt.scatter(y_pred, residuals)
# plt.xlabel('Predicted Place Final')
# plt.ylabel('Residuals')
# plt.title('Residuals vs Predicted Values')
# plt.show()

# plt.hist(residuals, bins=30)
# plt.xlabel('Residuals')
# plt.ylabel('Frequency')
# plt.title('Distribution of Residuals')
# plt.show()



# # This model is trying to predict how a song would score in the final based on the scores in the semifinal, how can I improve the model


# # linear regression
# # Splitting the data into training and testing sets
# # X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# # # Initializing and training the linear regression model
# # model = LinearRegression()
# # model.fit(X_train, y_train)

# # # Making predictions on the test set
# # y_pred = model.predict(X_test)
# # joblib.dump(model, 'trained_model.pkl')

# # # Evaluating the model
# # mse = mean_squared_error(y_test, y_pred)
# # print("Mean Squared Error:", mse)