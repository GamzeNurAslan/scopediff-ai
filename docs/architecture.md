# ScopeDiff AI – System Architecture

## Overview

ScopeDiff AI consists of a user interface, a backend service, NLP analysis modules, and a data storage layer.

## System Flow

1. The user uploads two requirement document versions.
2. The backend reads and validates the Excel files.
3. Requirements are cleaned and standardized.
4. The matching module pairs semantically related requirements.
5. The change detection module identifies the type of change.
6. The risk module assigns a risk level.
7. An optional defect description is compared with previous changes.
8. Results are displayed through the user interface.
9. The analysis can be exported as an Excel report.

## Components

### User Interface

The user interface will provide:

- Document upload
- Version selection
- Analysis dashboard
- Side-by-side requirement comparison
- Requirement history
- Defect-related change analysis
- Excel report download

### Backend

The backend will be developed with FastAPI.

Main responsibilities:

- File upload and validation
- Requirement preprocessing
- Version comparison
- Defect analysis
- Report generation
- Feedback storage

### NLP and Analysis Modules

The analysis layer will contain:

- TF-IDF baseline matching
- Sentence Transformer semantic matching
- Rule-based change detection
- Risk scoring
- Defect-change similarity ranking
- Contradiction detection prototype
- Question and test suggestion prototype

### Data Storage

SQLite will be used to store:

- Document versions
- Comparison results
- User feedback
- Analysis history

Excel and CSV files will be used for synthetic datasets and exported reports.

## Planned Technologies

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Python
- FastAPI
- Pydantic
- SQLite

### AI and Data Analysis

- Pandas
- scikit-learn
- Sentence Transformers
- Regular expressions

### Reporting and Visualization

- OpenPyXL
- Plotly or Recharts

## Privacy

The project will use only synthetic data and generic requirement examples. No confidential company data or internal service information will be included.