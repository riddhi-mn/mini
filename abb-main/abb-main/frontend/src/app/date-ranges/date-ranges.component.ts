import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService, DatasetMetadata, DateRangeRequest, DateRangeValidation } from '../data.service';

@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="date-ranges-container">
      <h2>Configure Date Ranges</h2>
      <p>Define time-based splits for training, testing, and simulation</p>

      <div class="ranges-card" *ngIf="metadata">
        <div class="dataset-info">
          <p><strong>Dataset Range:</strong> {{formatDate(metadata.earliestTimestamp)}} to {{formatDate(metadata.latestTimestamp)}}</p>
          <p><strong>Total Records:</strong> {{metadata.totalRecords | number}}</p>
        </div>

        <div class="period-cards">
          <div class="period-card">
            <h3>🟢 Training Period</h3>
            <div class="date-inputs">
              <label>
                Start Date:
                <input type="datetime-local" 
                       [(ngModel)]="dateRanges.trainingStart"
                       [min]="minDate"
                       [max]="maxDate">
              </label>
              <label>
                End Date:
                <input type="datetime-local" 
                       [(ngModel)]="dateRanges.trainingEnd"
                       [min]="minDate"
                       [max]="maxDate">
              </label>
            </div>
          </div>

          <div class="period-card">
            <h3>🟠 Testing Period</h3>
            <div class="date-inputs">
              <label>
                Start Date:
                <input type="datetime-local" 
                       [(ngModel)]="dateRanges.testingStart"
                       [min]="minDate"
                       [max]="maxDate">
              </label>
              <label>
                End Date:
                <input type="datetime-local" 
                       [(ngModel)]="dateRanges.testingEnd"
                       [min]="minDate"
                       [max]="maxDate">
              </label>
            </div>
          </div>

          <div class="period-card">
            <h3>🔵 Simulation Period</h3>
            <div class="date-inputs">
              <label>
                Start Date:
                <input type="datetime-local" 
                       [(ngModel)]="dateRanges.simulationStart"
                       [min]="minDate"
                       [max]="maxDate">
              </label>
              <label>
                End Date:
                <input type="datetime-local" 
                       [(ngModel)]="dateRanges.simulationEnd"
                       [min]="minDate"
                       [max]="maxDate">
              </label>
            </div>
          </div>
        </div>

        <div class="validation-section">
          <button class="validate-btn" 
                  (click)="validateRanges()"
                  [disabled]="isValidating">
            {{isValidating ? 'Validating...' : 'Validate Ranges'}}
          </button>

          <div class="validation-result" *ngIf="validation">
            <div class="success-message" *ngIf="validation.isValid">
              <span class="icon">✅</span>
              <span>Date ranges validated successfully!</span>
            </div>
            
            <div class="error-message" *ngIf="!validation.isValid">
              <span class="icon">❌</span>
              <span>{{validation.errorMessage}}</span>
            </div>

            <div class="range-summary" *ngIf="validation.isValid">
              <h4>Range Summary</h4>
              <div class="summary-grid">
                <div class="summary-item training">
                  <span class="label">Training Period:</span>
                  <span class="value">{{validation.trainingDays}} days ({{validation.trainingRecords | number}} records)</span>
                </div>
                <div class="summary-item testing">
                  <span class="label">Testing Period:</span>
                  <span class="value">{{validation.testingDays}} days ({{validation.testingRecords | number}} records)</span>
                </div>
                <div class="summary-item simulation">
                  <span class="label">Simulation Period:</span>
                  <span class="value">{{validation.simulationDays}} days ({{validation.simulationRecords | number}} records)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="actions" *ngIf="validation?.isValid">
          <button class="next-btn" (click)="goToNext()">
            Next: Train Model →
          </button>
        </div>
      </div>

      <div class="no-dataset" *ngIf="!metadata">
        <p>No dataset found. Please upload a dataset first.</p>
        <button class="back-btn" (click)="goToUpload()">
          ← Back to Upload
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./date-ranges.component.css']
})
export class DateRangesComponent implements OnInit {
  metadata: DatasetMetadata | null = null;
  minDate = '';
  maxDate = '';
  isValidating = false;
  validation: DateRangeValidation | null = null;

  dateRanges: DateRangeRequest = {
    trainingStart: '',
    trainingEnd: '',
    testingStart: '',
    testingEnd: '',
    simulationStart: '',
    simulationEnd: ''
  };

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.metadata = this.dataService.getMetadata();
    if (this.metadata) {
      this.setupDateLimits();
      this.setDefaultRanges();
    }
  }

  private setupDateLimits() {
    if (!this.metadata) return;
    
    this.minDate = this.toDateTimeLocal(this.metadata.earliestTimestamp);
    this.maxDate = this.toDateTimeLocal(this.metadata.latestTimestamp);
  }

  private setDefaultRanges() {
    if (!this.metadata) return;

    const start = new Date(this.metadata.earliestTimestamp);
    const end = new Date(this.metadata.latestTimestamp);
    const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    // Default: 60% training, 20% testing, 20% simulation
    const trainingDays = Math.floor(totalDays * 0.6);
    const testingDays = Math.floor(totalDays * 0.2);
    
    const trainingEnd = new Date(start.getTime() + trainingDays * 24 * 60 * 60 * 1000);
    const testingStart = new Date(trainingEnd.getTime() + 1000); // 1 second after training ends
    const testingEnd = new Date(testingStart.getTime() + testingDays * 24 * 60 * 60 * 1000);
    const simulationStart = new Date(testingEnd.getTime() + 1000); // 1 second after testing ends

    this.dateRanges = {
      trainingStart: this.toDateTimeLocal(start.toISOString()),
      trainingEnd: this.toDateTimeLocal(trainingEnd.toISOString()),
      testingStart: this.toDateTimeLocal(testingStart.toISOString()),
      testingEnd: this.toDateTimeLocal(testingEnd.toISOString()),
      simulationStart: this.toDateTimeLocal(simulationStart.toISOString()),
      simulationEnd: this.toDateTimeLocal(end.toISOString())
    };
  }

  private toDateTimeLocal(isoString: string): string {
    const date = new Date(isoString);
    return date.toISOString().slice(0, 16);
  }

  validateRanges() {
    this.isValidating = true;
    this.validation = null;

    // Convert datetime-local to ISO strings
    const request = {
      trainingStart: new Date(this.dateRanges.trainingStart).toISOString(),
      trainingEnd: new Date(this.dateRanges.trainingEnd).toISOString(),
      testingStart: new Date(this.dateRanges.testingStart).toISOString(),
      testingEnd: new Date(this.dateRanges.testingEnd).toISOString(),
      simulationStart: new Date(this.dateRanges.simulationStart).toISOString(),
      simulationEnd: new Date(this.dateRanges.simulationEnd).toISOString()
    };

    this.dataService.validateDateRanges(request).subscribe({
      next: (validation) => {
        this.validation = validation;
        this.isValidating = false;
      },
      error: (error) => {
        this.validation = {
          isValid: false,
          errorMessage: error.error?.error || 'Validation failed',
          trainingRecords: 0,
          testingRecords: 0,
          simulationRecords: 0,
          trainingDays: 0,
          testingDays: 0,
          simulationDays: 0
        };
        this.isValidating = false;
      }
    });
  }

  formatDate(isoString: string): string {
    return new Date(isoString).toLocaleDateString();
  }

  goToNext() {
    this.router.navigate(['/training']);
  }

  goToUpload() {
    this.router.navigate(['/upload']);
  }
}
