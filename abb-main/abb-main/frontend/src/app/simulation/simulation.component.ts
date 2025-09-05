import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DataService, DatasetMetadata } from '../data.service';

interface SimulationData {
  timestamp: string;
  sample_id: number;
  prediction: number;
  confidence: number;
  actual?: number;
  features: any;
}

interface SimulationStats {
  totalPredictions: number;
  passCount: number;
  failCount: number;
  averageConfidence: number;
}

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="simulation-container">
      <h2>Real-Time Prediction Simulation</h2>
      <p>Simulate model inference on historical data at second-level granularity</p>

      <div class="simulation-card" *ngIf="metadata">
        <div class="simulation-controls">
          <button class="simulation-btn start" 
                  *ngIf="!isSimulationRunning && !isSimulationCompleted"
                  (click)="startSimulation()">
            Start Simulation
          </button>

          <button class="simulation-btn restart" 
                  *ngIf="isSimulationCompleted"
                  (click)="restartSimulation()">
            Restart Simulation
          </button>

          <div class="simulation-status running" *ngIf="isSimulationRunning">
            <div class="status-indicator"></div>
            <span>Simulation running... ({{currentIndex + 1}} / {{simulationData.length}})</span>
          </div>

          <div class="simulation-status completed" *ngIf="isSimulationCompleted">
            <span class="icon">✅</span>
            <span>Simulation completed</span>
          </div>
        </div>

        <div class="simulation-dashboard" *ngIf="stats.totalPredictions > 0">
          <div class="charts-section">
            <div class="chart-container">
              <h4>Real-Time Quality Predictions</h4>
              <div class="line-chart">
                <div class="chart-placeholder">
                  <canvas #qualityChart width="400" height="200"></canvas>
                </div>
              </div>
            </div>

            <div class="chart-container">
              <h4>Prediction Confidence Distribution</h4>
              <div class="donut-chart">
                <div class="confidence-summary">
                  <div class="confidence-item pass">
                    <div class="confidence-color"></div>
                    <span>Pass: {{stats.passCount}}</span>
                  </div>
                  <div class="confidence-item fail">
                    <div class="confidence-color"></div>
                    <span>Fail: {{stats.failCount}}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="stats-panel">
            <h4>Statistics</h4>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">{{stats.totalPredictions}}</div>
                <div class="stat-label">Total Predictions</div>
              </div>
              <div class="stat-item pass">
                <div class="stat-value">{{stats.passCount}}</div>
                <div class="stat-label">Pass Count</div>
              </div>
              <div class="stat-item fail">
                <div class="stat-value">{{stats.failCount}}</div>
                <div class="stat-label">Fail Count</div>
              </div>
              <div class="stat-item confidence">
                <div class="stat-value">{{stats.averageConfidence | number:'1.1-1'}}%</div>
                <div class="stat-label">Avg Confidence</div>
              </div>
            </div>
          </div>

          <div class="live-table">
            <h4>Live Prediction Stream</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Sample ID</th>
                    <th>Prediction</th>
                    <th>Confidence</th>
                    <th>Features</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let item of displayedData; let i = index" 
                      [class.latest]="i === 0"
                      [class.pass]="item.prediction === 1"
                      [class.fail]="item.prediction === 0">
                    <td>{{formatTime(item.timestamp)}}</td>
                    <td>{{item.sample_id}}</td>
                    <td>
                      <span class="prediction-badge" [class.pass]="item.prediction === 1" [class.fail]="item.prediction === 0">
                        {{item.prediction === 1 ? 'Pass' : 'Fail'}}
                      </span>
                    </td>
                    <td>{{item.confidence | number:'1.1-1'}}%</td>
                    <td>
                      <button class="features-btn" (click)="toggleFeatures(i)">
                        {{expandedFeatures[i] ? 'Hide' : 'Show'}}
                      </button>
                    </td>
                  </tr>
                  <tr *ngFor="let item of displayedData; let i = index" 
                      [style.display]="expandedFeatures[i] ? 'table-row' : 'none'"
                      class="features-row">
                    <td colspan="5">
                      <div class="features-details">
                        <div *ngFor="let feature of getFeatureEntries(item.features)" class="feature-item">
                          <span class="feature-name">{{feature.key}}:</span>
                          <span class="feature-value">{{feature.value | number:'1.2-2'}}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="error-message" *ngIf="errorMessage">
          <span class="icon">❌</span>
          <span>{{errorMessage}}</span>
        </div>
      </div>

      <div class="no-dataset" *ngIf="!metadata">
        <p>No dataset found. Please complete the previous steps first.</p>
        <button class="back-btn" (click)="goToUpload()">
          ← Back to Upload
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./simulation.component.css']
})
export class SimulationComponent implements OnInit, OnDestroy {
  metadata: DatasetMetadata | null = null;
  simulationData: SimulationData[] = [];
  displayedData: SimulationData[] = [];
  currentIndex = 0;
  isSimulationRunning = false;
  isSimulationCompleted = false;
  errorMessage = '';
  simulationInterval: any;
  expandedFeatures: boolean[] = [];

  stats: SimulationStats = {
    totalPredictions: 0,
    passCount: 0,
    failCount: 0,
    averageConfidence: 0
  };

  constructor(
    private dataService: DataService,
    private router: Router
  ) {}

  ngOnInit() {
    this.metadata = this.dataService.getMetadata();
  }

  ngOnDestroy() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
  }

  startSimulation() {
    if (!this.metadata) return;

    this.isSimulationRunning = true;
    this.errorMessage = '';
    this.displayedData = [];
    this.currentIndex = 0;

    // Use sample date range for simulation
    const simulationStart = new Date(this.metadata.earliestTimestamp);
    const simulationEnd = new Date(simulationStart.getTime() + 24 * 60 * 60 * 1000); // 1 day

    this.dataService.getSimulationData(
      simulationStart.toISOString(),
      simulationEnd.toISOString()
    ).subscribe({
      next: (response) => {
        this.simulationData = response.data || [];
        this.runSimulation();
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Failed to start simulation';
        this.isSimulationRunning = false;
      }
    });
  }

  private runSimulation() {
    if (this.simulationData.length === 0) {
      this.errorMessage = 'No simulation data available';
      this.isSimulationRunning = false;
      return;
    }

    this.simulationInterval = setInterval(() => {
      if (this.currentIndex < this.simulationData.length) {
        const newItem = this.simulationData[this.currentIndex];
        this.displayedData.unshift(newItem);
        
        // Keep only last 10 items for performance
        if (this.displayedData.length > 10) {
          this.displayedData = this.displayedData.slice(0, 10);
        }

        this.expandedFeatures = new Array(this.displayedData.length).fill(false);
        this.updateStats();
        this.currentIndex++;
      } else {
        this.completeSimulation();
      }
    }, 1000); // 1 second interval
  }

  private updateStats() {
    this.stats.totalPredictions = this.currentIndex;
    this.stats.passCount = this.simulationData.slice(0, this.currentIndex).filter(item => item.prediction === 1).length;
    this.stats.failCount = this.stats.totalPredictions - this.stats.passCount;
    
    const totalConfidence = this.simulationData.slice(0, this.currentIndex).reduce((sum, item) => sum + item.confidence, 0);
    this.stats.averageConfidence = this.stats.totalPredictions > 0 ? totalConfidence / this.stats.totalPredictions : 0;
  }

  private completeSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.isSimulationRunning = false;
    this.isSimulationCompleted = true;
  }

  restartSimulation() {
    this.isSimulationCompleted = false;
    this.startSimulation();
  }

  toggleFeatures(index: number) {
    this.expandedFeatures[index] = !this.expandedFeatures[index];
  }

  getFeatureEntries(features: any): { key: string, value: any }[] {
    if (!features) return [];
    return Object.entries(features).slice(0, 5).map(([key, value]) => ({ key, value }));
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }

  goToUpload() {
    this.router.navigate(['/upload']);
  }
}
