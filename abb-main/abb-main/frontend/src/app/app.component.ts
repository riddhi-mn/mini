import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <div class="app-container">
      <header class="app-header">
        <h1>IntelliInspect</h1>
        <p>Real-Time Predictive Quality Control</p>
      </header>
      
      <nav class="app-nav">
        <div class="progress-indicator">
          <div class="step" [class.active]="currentStep >= 1" [class.completed]="currentStep > 1">
            <span class="step-number">1</span>
            <span class="step-label">Upload Dataset</span>
          </div>
          <div class="step" [class.active]="currentStep >= 2" [class.completed]="currentStep > 2">
            <span class="step-number">2</span>
            <span class="step-label">Date Ranges</span>
          </div>
          <div class="step" [class.active]="currentStep >= 3" [class.completed]="currentStep > 3">
            <span class="step-number">3</span>
            <span class="step-label">Model Training</span>
          </div>
          <div class="step" [class.active]="currentStep >= 4" [class.completed]="currentStep > 4">
            <span class="step-number">4</span>
            <span class="step-label">Simulation</span>
          </div>
        </div>
        
        <div class="tab-navigation">
          <button [class.active]="currentStep === 1" (click)="navigateTo('/upload', 1)">Upload Dataset</button>
          <button [class.active]="currentStep === 2" (click)="navigateTo('/dates', 2)" [disabled]="currentStep < 2">Date Ranges</button>
          <button [class.active]="currentStep === 3" (click)="navigateTo('/training', 3)" [disabled]="currentStep < 3">Model Training</button>
          <button [class.active]="currentStep === 4" (click)="navigateTo('/simulation', 4)" [disabled]="currentStep < 4">Simulation</button>
        </div>
      </nav>
      
      <main class="app-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  currentStep = 1;

  constructor(private router: Router) {
    this.router.events.subscribe(() => {
      this.updateCurrentStep();
    });
  }

  navigateTo(route: string, step: number) {
    if (step <= this.currentStep || this.canNavigateToStep(step)) {
      this.router.navigate([route]);
      this.currentStep = step;
    }
  }

  private canNavigateToStep(step: number): boolean {
    // Logic to determine if user can navigate to a specific step
    return step <= this.currentStep + 1;
  }

  private updateCurrentStep() {
    const url = this.router.url;
    if (url.includes('/upload')) this.currentStep = 1;
    else if (url.includes('/dates')) this.currentStep = 2;
    else if (url.includes('/training')) this.currentStep = 3;
    else if (url.includes('/simulation')) this.currentStep = 4;
  }
}
