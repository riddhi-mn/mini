# IntelliInspect: Real-Time Predictive Quality Control

A full-stack AI-powered application that enables real-time quality control prediction using Kaggle Production Line sensor data.

## System Architecture

- **Frontend**: Angular 18+ with responsive UI and real-time charts
- **Backend**: ASP.NET Core 8 REST API for data processing and coordination
- **ML Service**: Python 3.13 + FastAPI with XGBoost/LightGBM for machine learning
- **Deployment**: Docker + docker-compose for containerized deployment

## Features

### 1. Dataset Upload (Screen 1)
- Drag-and-drop CSV file upload interface
- Automatic dataset validation and synthetic timestamp augmentation
- Real-time metadata extraction and display
- Support for Kaggle Production Line Performance data

### 2. Date Range Configuration (Screen 2)
- Interactive calendar-based date pickers
- Validation of sequential, non-overlapping time periods
- Training, Testing, and Simulation period configuration
- Visual feedback and range statistics

### 3. Model Training & Evaluation (Screen 3)
- XGBoost model training with hyperparameter optimization
- Comprehensive performance metrics (Accuracy, Precision, Recall, F1-Score)
- Confusion matrix visualization
- Training and test sample statistics

### 4. Real-Time Prediction Simulation (Screen 4)
- Second-level granularity streaming simulation
- Live quality score charts and confidence distribution
- Real-time statistics and prediction table
- Expandable feature details for each prediction

## Quick Start

### Prerequisites
- Docker and Docker Compose
- 8GB+ RAM recommended
- Internet connection for initial container builds

### Running the Application

1. Clone the repository:
```bash
git clone <repository-url>
cd abb
```

2. Start all services:
```bash
docker compose up --build
```

3. Access the application:
- Frontend: http://localhost:4200
- Backend API: http://localhost:5000
- ML Service: http://localhost:8000

### Sample Dataset

The application expects a CSV file with:
- Multiple sensor reading columns
- A `Response` column (binary: 0/1 or false/true)
- Optional `synthetic_timestamp` column (auto-generated if missing)

For testing, you can use the Kaggle Bosch Production Line Performance dataset:
https://www.kaggle.com/c/bosch-production-line-performance/data

## API Endpoints

### Backend API (Port 5000)

#### Dataset Management
- `POST /api/dataset/upload` - Upload and process CSV dataset
- `POST /api/dataset/validate-ranges` - Validate date range configuration
- `GET /api/dataset/metadata` - Get current dataset metadata

#### Model Operations
- `POST /api/ml/train` - Train machine learning model
- `GET /api/ml/simulation/{start}/{end}` - Get simulation data

### ML Service API (Port 8000)

#### Core ML Operations
- `POST /set-dataset` - Load dataset for ML operations
- `POST /train-model` - Train XGBoost classifier
- `POST /predict` - Single prediction endpoint
- `GET /simulation/{start}/{end}` - Batch simulation data

## Development

### Local Development Setup

#### Frontend (Angular)
```bash
cd frontend
npm install
npm start
# Access at http://localhost:4200
```

#### Backend (.NET)
```bash
cd backend
dotnet restore
dotnet run
# Access at http://localhost:5000
```

#### ML Service (Python)
```bash
cd ml_service
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
# Access at http://localhost:8000
```

### Building Individual Services

#### Frontend
```bash
cd frontend
npm run build
```

#### Backend
```bash
cd backend
dotnet build
dotnet publish -c Release
```

#### ML Service
```bash
cd ml_service
docker build -t intelliinspect-ml .
```

## Technical Details

### Data Flow
1. User uploads CSV via Angular frontend
2. .NET backend validates and augments dataset with synthetic timestamps
3. Backend forwards processed data to Python ML service
4. ML service trains XGBoost model on configured date ranges
5. Real-time simulation streams predictions back through the API chain

### Machine Learning
- **Algorithm**: XGBoost Classifier
- **Features**: All numeric columns except timestamp and response
- **Evaluation**: Accuracy, Precision, Recall, F1-Score, Confusion Matrix
- **Time-based Splitting**: Sequential train/test/simulation periods

### Frontend Technology
- **Framework**: Angular 18+ with standalone components
- **Styling**: Custom CSS with gradient backgrounds and animations
- **Charts**: Chart.js integration for real-time visualizations
- **State Management**: RxJS observables and services

### Backend Technology
- **Framework**: ASP.NET Core 8 Web API
- **Data Processing**: CsvHelper for CSV parsing
- **HTTP Client**: Integration with ML service
- **CORS**: Configured for frontend communication

## Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 4200, 5000, and 8000 are available
2. **Memory issues**: Increase Docker memory limit for large datasets
3. **Build failures**: Check all dependencies are installed correctly

### Docker Issues
```bash
# Clean up containers and images
docker compose down
docker system prune -f

# Rebuild from scratch
docker compose up --build --force-recreate
```

### Performance Optimization
- Use smaller datasets for development (< 10,000 rows)
- Adjust simulation speed in the frontend component
- Consider chunking large files for production use

## License

This project is developed for educational and demonstration purposes.

## Contributors

Built as part of the IntelliInspect Hackathon specification.