@echo off
echo Installation de pymongo si necessaire...
pip install pymongo --quiet
echo.
python test-atlas-python.py
