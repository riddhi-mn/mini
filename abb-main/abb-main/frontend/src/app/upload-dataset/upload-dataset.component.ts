import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService, DatasetMetadata } from '../data.service';

@Component({
  selector: 'app-upload-dataset',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upload-container">
      <h2>Upload Dataset</h2>
      <p>Upload the Kaggle Production Line sensor data CSV file</p>

      <div class="upload-card" *ngIf="!metadata">
        <div class="upload-area" 
             [class.drag-over]="isDragOver"
             (dragover)="onDragOver($event)"
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             (click)="fileInput.click()">
          
          <div class="upload-content">
            <div class="csv-icon">📄</div>
            <p class="upload-text">Click to select a CSV file or drag and drop</p>
            <p class="upload-subtext">Only CSV files are accepted</p>
          </div>
          
          <input #fileInput 
                 type="file" 
                 accept=".csv" 
                 (change)="onFileSelected($event)"
                 style="display: none">
        </div>

        <div class="upload-status" *ngIf="isUploading">
          <div class="loading-spinner"></div>
          <p>Processing dataset...</p>
        </div>

        <div class="error-message" *ngIf="errorMessage">
          <p>❌ {{errorMessage}}</p>
        </div>
      </div>

      <div class="summary-card" *ngIf="metadata">
        <h3>Dataset Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">File:</span>
            <span class="value">{{metadata.fileName}}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Records:</span>
            <span class="value">{{metadata.totalRecords | number}}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Columns:</span>
            <span class="value">{{metadata.totalColumns}}</span>
          </div>
          <div class="summary-item">
            <span class="label">Pass Rate:</span>
            <span class="value">{{metadata.passRate | number:'1.1-1'}}%</span>
          </div>
          <div class="summary-item">
            <span class="label">Date Range:</span>
            <span class="value">{{formatDateRange()}}</span>
          </div>
        </div>

        <div class="actions">
          <button class="next-btn" (click)="goToNext()">
            Next: Configure Date Ranges →
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./upload-dataset.component.css']
})
export class UploadDatasetComponent {
  metadata: DatasetMetadata | null = null;
  isDragOver = false;
  isUploading = false;
  errorMessage = '';

  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    // Check if metadata already exists
    this.metadata = this.dataService.getMetadata();
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.errorMessage = 'Please select a CSV file';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';

    this.dataService.uploadDataset(file).subscribe({
      next: (metadata) => {
        this.metadata = metadata;
        this.isUploading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to upload dataset';
        this.isUploading = false;
      }
    });
  }

  formatDateRange(): string {
    if (!this.metadata) return '';
    const start = new Date(this.metadata.earliestTimestamp).toLocaleDateString();
    const end = new Date(this.metadata.latestTimestamp).toLocaleDateString();
    return `${start} to ${end}`;
  }

  goToNext() {
    this.router.navigate(['/dates']);
  }
}
