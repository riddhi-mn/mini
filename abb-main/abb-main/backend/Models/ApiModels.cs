namespace IntelliInspectApi.Models;

public class DatasetMetadata
{
    public string FileName { get; set; } = string.Empty;
    public int TotalRecords { get; set; }
    public int TotalColumns { get; set; }
    public double PassRate { get; set; }
    public DateTime EarliestTimestamp { get; set; }
    public DateTime LatestTimestamp { get; set; }
}

public class DateRangeRequest
{
    public DateTime TrainingStart { get; set; }
    public DateTime TrainingEnd { get; set; }
    public DateTime TestingStart { get; set; }
    public DateTime TestingEnd { get; set; }
    public DateTime SimulationStart { get; set; }
    public DateTime SimulationEnd { get; set; }
}

public class DateRangeValidation
{
    public bool IsValid { get; set; }
    public string? ErrorMessage { get; set; }
    public int TrainingRecords { get; set; }
    public int TestingRecords { get; set; }
    public int SimulationRecords { get; set; }
    public int TrainingDays { get; set; }
    public int TestingDays { get; set; }
    public int SimulationDays { get; set; }
}

public class TrainingRequest
{
    public string TrainStart { get; set; } = string.Empty;
    public string TrainEnd { get; set; } = string.Empty;
    public string TestStart { get; set; } = string.Empty;
    public string TestEnd { get; set; } = string.Empty;
}

public class TrainingResult
{
    public string Status { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public ModelMetrics? Metrics { get; set; }
    public int TrainingSamples { get; set; }
    public int TestSamples { get; set; }
}

public class ModelMetrics
{
    public double Accuracy { get; set; }
    public double Precision { get; set; }
    public double Recall { get; set; }
    public double F1Score { get; set; }
    public int[,]? ConfusionMatrix { get; set; }
    public double[]? FeatureImportance { get; set; }
    public string[]? FeatureNames { get; set; }
}

public class SimulationRequest
{
    public string SimulationStart { get; set; } = string.Empty;
    public string SimulationEnd { get; set; } = string.Empty;
}