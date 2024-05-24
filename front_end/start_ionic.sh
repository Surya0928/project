#!/bin/bash

# Activate the virtual environment
source /root/project/venv/bin/activate

# Navigate to the project directory
cd /root/project/front_end

# Start the Ionic server
ionic serve --host=165.232.188.250 --port=8101
