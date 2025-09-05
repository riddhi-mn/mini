import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface DatasetMetadata {
  fileName: string;
  totalRecords: number;
  totalColumns: number;
  passRate: number;
  earliestTimestamp: string;
  latestTimestamp: string;
}

export interface DateRangeRequest {
  trainingStart: string;
  trainingEnd: string;
  testingStart: string;
  testingEnd: string;
  simulationStart: string;
  simulationEnd: string;
}

export interface DateRangeValidation {
  isValid: boolean;
  errorMessage?: string;
  trainingRecords: number;
  testingRecords: number;
  simulationRecords: number;
  trainingDays: number;
  testingDays: number;
  simulationDays: number;
}

export interface TrainingResult {
  status: string;
  message: string;
  metrics: any;
  trainingSamples: number;
  testSamples: number;
}

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private readonly apiUrl = 'http://localhost:5000/api';
  private metadataSubject = new BehaviorSubject<DatasetMetadata | null>(null);
  public metadata$ = this.metadataSubject.asObservable();

  constructor(private http: HttpClient) {}

  uploadDataset(file: File): Observable<DatasetMetadata> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<DatasetMetadata>(`${this.apiUrl}/dataset/upload`, formData)
      .pipe(
        map(metadata => {
          this.metadataSubject.next(metadata);
          return metadata;
        })
      );
  }

  validateDateRanges(request: DateRangeRequest): Observable<DateRangeValidation> {
    return this.http.post<DateRangeValidation>(`${this.apiUrl}/dataset/validate-ranges`, request);
  }

  trainModel(request: any): Observable<TrainingResult> {
    return this.http.post<TrainingResult>(`${this.apiUrl}/ml/train`, request);
  }

  getSimulationData(simulationStart: string, simulationEnd: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/ml/simulation/${simulationStart}/${simulationEnd}`);
  }

  getMetadata(): DatasetMetadata | null {
    return this.metadataSubject.value;
  }
}
