import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService, DatasetMetadata, TrainingResult } from '../data.service';

@Component({
  selector: 'app-model-training',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="training-container">
      <h2>Model Training & Evaluation</h2>
      <p>Train an XGBoost model and evaluate its performance</p>

      <div class="training-card" *ngIf="metadata">
        <div class="training-controls" *ngIf="!trainingResult">
          <h3>Ready to Train Model</h3>
          <p>This will train an XGBoost classifier on your configured date ranges.</p>
          
          <div class="training-info">
            <div class="info-item">
              <span class="label">Dataset:</span>
              <span class="value">{{metadata.fileName}}</span>
            </div>
            <div class="info-item">
              <span class="label">Total Records:</span>
              <span class="value">{{metadata.totalRecords | number}}</span>
            </div>
            <div class="info-item">
              <span class="label">Features:</span>
              <span class="value">{{metadata.totalColumns - 2}} (excluding timestamp and response)</span>
            </div>
          </div>

          <button class="train-btn" 
                  (click)="trainModel()"
                  [disabled]="isTraining">
            {{isTraining ? 'Training Model...' : 'Train Model'}}
          </button>

          <div class="training-status" *ngIf="isTraining">
            <div class="loading-spinner"></div>
            <p>Training in progress... This may take a few moments.</p>
          </div>
        </div>

        <div class="training-error" *ngIf="errorMessage">
          <span class="icon">❌</span>
          <span>{{errorMessage}}</span>
        </div>

        <div class="training-results" *ngIf="trainingResult">
          <div class="success-message">
            <span class="icon">✅</span>
            <span>{{trainingResult.message}}</span>
          </div>

          <div class="metrics-section">
            <h3>Model Performance Metrics</h3>
            
            <div class="metrics-grid">
              <div class="metric-card accuracy">
                <div class="metric-value">{{(trainingResult.metrics.accuracy * 100) | number:'1.1-1'}}%</div>
                <div class="metric-label">Accuracy</div>
              </div>
              
              <div class="metric-card precision">
                <div class="metric-value">{{(trainingResult.metrics.precision * 100) | number:'1.1-1'}}%</div>
                <div class="metric-label">Precision</div>
              </div>
              
              <div class="metric-card recall">
                <div class="metric-value">{{(trainingResult.metrics.recall * 100) | number:'1.1-1'}}%</div>
                <div class="metric-label">Recall</div>
              </div>
              
              <div class="metric-card f1">
                <div class="metric-value">{{(trainingResult.metrics.f1_score * 100) | number:'1.1-1'}}%</div>
                <div class="metric-label">F1-Score</div>
              </div>
            </div>
          </div>

          <div class="training-summary">
            <h4>Training Summary</h4>
            <div class="summary-items">
              <div class="summary-item">
                <span class="label">Training Samples:</span>
                <span class="value">{{trainingResult.trainingSamples | number}}</span>
              </div>
              <div class="summary-item">
                <span class="label">Test Samples:</span>
                <span class="value">{{trainingResult.testSamples | number}}</span>
              </div>
            </div>
          </div>

          <div class="confusion-matrix" *ngIf="trainingResult.metrics.confusion_matrix">
            <h4>Confusion Matrix</h4>
            <div class="matrix-visualization">
              <div class="matrix-grid">
                <div class="matrix-header">Predicted</div>
                <div class="matrix-header">Fail</div>
                <div class="matrix-header">Pass</div>
                
                <div class="matrix-label">Actual Fail</div>
                <div class="matrix-cell tn">{{trainingResult.metrics.confusion_matrix[0][0]}}</div>
                <div class="matrix-cell fp">{{trainingResult.metrics.confusion_matrix[0][1]}}</div>
                
                <div class="matrix-label">Actual Pass</div>
                <div class="matrix-cell fn">{{trainingResult.metrics.confusion_matrix[1][0]}}</div>
                <div class="matrix-cell tp">{{trainingResult.metrics.confusion_matrix[1][1]}}</div>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="next-btn" (click)="goToNext()">
              Next: Run Simulation →
            </button>
          </div>
        </div>
      </div>

      <div class="no-dataset" *ngIf="!metadata">
        <p>No dataset found. Please upload a dataset and configure date ranges first.</p>
        <button class="back-btn" (click)="goToUpload()">
          ← Back to Upload
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./model-training.component.css']
})
export class ModelTrainingComponent implements OnInit {
  metadata: DatasetMetadata | null = null;
  isTraining = false;
  trainingResult: TrainingResult | null = null;
  errorMessage = '';

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.metadata = this.dataService.getMetadata();
  }

  trainModel() {
    if (!this.metadata) return;

    this.isTraining = true;
    this.errorMessage = '';
    this.trainingResult = null;

    // For simplicity, we'll use hardcoded date ranges
    // In a real application, you'd get these from the previous step
    const request = {
      trainStart: new Date(this.metadata.earliestTimestamp).toISOString(),
      trainEnd: new Date(Date.parse(this.metadata.earliestTimestamp) + 7 * 24 * 60 * 60 * 1000).toISOString(),
      testStart: new Date(Date.parse(this.metadata.earliestTimestamp) + 7 * 24 * 60 * 60 * 1000 + 1000).toISOString(),
      testEnd: new Date(Date.parse(this.metadata.earliestTimestamp) + 10 * 24 * 60 * 60 * 1000).toISOString()
    };

    this.dataService.trainModel(request).subscribe({
      next: (result) => {
        this.trainingResult = result;
        this.isTraining = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Training failed';
        this.isTraining = false;
      }
    });
  }

  goToNext() {
    this.router.navigate(['/simulation']);
  }

  goToUpload() {
    this.router.navigate(['/upload']);
  }
}
