import pandas as pd
import numpy as np

# Load the historical data
historical_data = pd.read_excel('EmscFullStats.xlsx')

# Clean the data by converting relevant columns to numeric and dropping rows with non-numeric data
historical_data['Place Semi'] = pd.to_numeric(historical_data['Place Semi'], errors='coerce')
historical_data['Place Final'] = pd.to_numeric(historical_data['Place Final'], errors='coerce')
historical_data['Running Final'] = pd.to_numeric(historical_data['Running Final'], errors='coerce')

# Drop rows with missing values
historical_data_cleaned = historical_data.dropna(subset=['Place Semi', 'Place Final', 'Running Final'])

# Filter for running orders from 2 to 10
# filtered_data = historical_data_cleaned[(historical_data_cleaned['Running Final'] >= 4) & (historical_data_cleaned['Running Final'] <= 8)]
filtered_data = historical_data_cleaned[(historical_data_cleaned['Place Semi'] <= 5)]
# Define weak songs: Songs with a semi-final placement worse than a certain threshold (e.g., 15th place)
threshold = 6
historical_data_cleaned['Is Weak Previous Song'] = historical_data_cleaned.groupby('Edition')['Place Semi'].shift(1) > threshold
filtered_data['Is Weak Previous Song'] = filtered_data.groupby('Edition')['Place Semi'].shift(1) > threshold

# Calculate the average final placement for songs that follow weak songs vs. those that don't
average_final_place_following_weak = historical_data_cleaned.groupby('Is Weak Previous Song')['Place Final'].mean()

# Display the results
print("Average Final Placement Based on Previous Song Strength:")
print(average_final_place_following_weak)

filtered_average_final_place_following_weak = filtered_data.groupby('Is Weak Previous Song')['Place Final'].mean()

# Display the results
print("Filtered Average Final Placement Based on Previous Song Strength (Running Orders 2 to 10):")
print(filtered_average_final_place_following_weak)

# import pandas as pd
# import numpy as np

# # Load the historical data
# historical_data = pd.read_excel('EmscFullStats.xlsx')

# # Clean the data by converting relevant columns to numeric and dropping rows with non-numeric data
# historical_data['Place Semi'] = pd.to_numeric(historical_data['Place Semi'], errors='coerce')
# historical_data['Place Final'] = pd.to_numeric(historical_data['Place Final'], errors='coerce')
# historical_data['Running Final'] = pd.to_numeric(historical_data['Running Final'], errors='coerce')

# # Drop rows with missing values
# historical_data_cleaned = historical_data.dropna(subset=['Place Semi', 'Place Final', 'Running Final'])

# # Define weak songs: Songs with a semi-final placement worse than a certain threshold (e.g., 15th place)
# threshold = 15
# historical_data_cleaned['Is Weak Previous Song'] = historical_data_cleaned.groupby('Edition')['Place Semi'].shift(1) > threshold

# # Calculate the average final placement for songs that follow weak songs vs. those that don't
# average_final_place_following_weak = historical_data_cleaned.groupby('Is Weak Previous Song')['Place Final'].mean()

# # Display the results
# print("Average Final Placement Based on Previous Song Strength:")
# print(average_final_place_following_weak)
