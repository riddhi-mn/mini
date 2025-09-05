import { Routes } from '@angular/router';
import { UploadDatasetComponent } from './upload-dataset/upload-dataset.component';
import { DateRangesComponent } from './date-ranges/date-ranges.component';
import { ModelTrainingComponent } from './model-training/model-training.component';
import { SimulationComponent } from './simulation/simulation.component';

export const routes: Routes = [
  { path: '', redirectTo: '/upload', pathMatch: 'full' },
  { path: 'upload', component: UploadDatasetComponent },
  { path: 'dates', component: DateRangesComponent },
  { path: 'training', component: ModelTrainingComponent },
  { path: 'simulation', component: SimulationComponent }
];
