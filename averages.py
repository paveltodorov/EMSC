import pandas as pd

# Load the historical data
historical_data = pd.read_excel('EmscFullStats.xlsx')

# Load the semi-final results for the new edition
new_data = pd.read_excel('Emsc2404Semis.xlsx')

# Calculate the average final place for each running order historically
average_final_place_by_running = historical_data.groupby('Running Final')['Place Final'].mean().reset_index()
average_final_place_by_running = average_final_place_by_running.sort_values('Place Final')

# Assign running orders for the final
finalists = new_data['Country']
running_order = list(range(1, 26))  # Running positions 1 to 25

# Prioritize Bulgaria
bulgaria_idx = finalists[finalists == "Bulgaria"].index[0]
best_running_position = average_final_place_by_running.iloc[0]['Running Final']

# Assign the best position to Bulgaria
new_data.loc[bulgaria_idx, 'Running Final'] = best_running_position
running_order.remove(best_running_position)

# Assign remaining running positions randomly
for i in new_data.index:
    if pd.isna(new_data.loc[i, 'Running Final']):
        new_data.loc[i, 'Running Final'] = running_order.pop(0)

# Save the updated final data
new_data.to_excel('/mnt/data/Emsc2404FinalsWithRunningOrder.xlsx', index=False)

print("Assigned running order positions with the best chance for Bulgaria to win.")
