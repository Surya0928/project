import pandas as pd
from datetime import datetime

# Read CSV file
csv_file_path = '/home/surya/Downloads/bePaid - Tally-data.csv'
df = pd.read_csv(csv_file_path)

# Store original 'Due on' column before converting to datetime
original_due_on = df['Due on']

# Rename columns to desired names
new_column_names = {
    'Date': 'invoice_date',
    'Ref. No.': 'ref_no',
    'Party\'s Name': 'party_name',
    'Pending': 'pending_amount',
    'Due on': 'due_date'
}
df = df.rename(columns=new_column_names)

# Convert 'due_date' column to datetime to calculate days passed
df['due_date'] = pd.to_datetime(df['due_date'], format='%d-%b-%y', errors='coerce')

# Filter out rows with invalid datetime values (e.g., 'NaT' values)
df = df.dropna(subset=['due_date'])

# Convert today's date to pandas Timestamp (to match 'due_date' datatype)
today = pd.Timestamp(datetime.today().date())

# Calculate number of days passed from due date to today
df['days_passed'] = (today - df['due_date']).dt.days

# Revert 'due_date' column back to original format
df['due_date'] = original_due_on

# Remove the 'days_passed' column (if present)
if 'Overdue' in df.columns:
    df.drop('Overdue', axis=1, inplace=True)

# Save updated DataFrame back to CSV with the new column names and original 'Due on' format
output_csv_file_path = 'tally_proj/csv_generation/files/due_included.csv'
df.to_csv(output_csv_file_path, index=False)

print(f"Updated CSV file saved to: {output_csv_file_path}")
