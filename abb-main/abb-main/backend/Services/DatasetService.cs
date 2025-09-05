using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using System.Text.Json;
using IntelliInspectApi.Models;

namespace IntelliInspectApi.Services;

public class DatasetService
{
    private readonly HttpClient _httpClient;
    private Dictionary<string, object>? _currentDataset;
    private DatasetMetadata? _metadata;

    public DatasetService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<DatasetMetadata> ProcessDatasetAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("No file provided");

        if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("File must be a CSV file");

        var records = new List<Dictionary<string, object>>();
        
        using (var reader = new StreamReader(file.OpenReadStream()))
        using (var csv = new CsvReader(reader, CultureInfo.InvariantCulture))
        {
            var csvRecords = csv.GetRecords<dynamic>().ToList();
            
            foreach (var record in csvRecords)
            {
                var dict = new Dictionary<string, object>();
                foreach (var property in record)
                {
                    dict[property.Key] = property.Value;
                }
                records.Add(dict);
            }
        }

        if (!records.Any() || !records.First().ContainsKey("Response"))
            throw new ArgumentException("Dataset must contain a 'Response' column");

        // Add synthetic timestamps if not present
        if (!records.First().ContainsKey("synthetic_timestamp"))
        {
            var baseTime = new DateTime(2021, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            for (int i = 0; i < records.Count; i++)
            {
                records[i]["synthetic_timestamp"] = baseTime.AddSeconds(i).ToString("yyyy-MM-ddTHH:mm:ssZ");
            }
        }

        // Calculate metadata
        var passCount = records.Count(r => 
            r.ContainsKey("Response") && 
            (r["Response"]?.ToString() == "1" || r["Response"]?.ToString()?.ToLower() == "true"));

        var passRate = records.Count > 0 ? (double)passCount / records.Count * 100 : 0;

        var timestamps = records.Select(r => DateTime.Parse(r["synthetic_timestamp"].ToString())).ToList();
        var earliestTimestamp = timestamps.Min();
        var latestTimestamp = timestamps.Max();

        _metadata = new DatasetMetadata
        {
            FileName = file.FileName,
            TotalRecords = records.Count,
            TotalColumns = records.First().Keys.Count,
            PassRate = passRate,
            EarliestTimestamp = earliestTimestamp,
            LatestTimestamp = latestTimestamp
        };

        // Store dataset
        _currentDataset = new Dictionary<string, object>
        {
            ["data"] = records
        };

        // Send dataset to ML service
        await SendDatasetToMLService();

        return _metadata;
    }

    private async Task SendDatasetToMLService()
    {
        if (_currentDataset == null) return;

        var json = JsonSerializer.Serialize(_currentDataset);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        
        try
        {
            var response = await _httpClient.PostAsync("http://ml_service:8000/set-dataset", content);
            response.EnsureSuccessStatusCode();
        }
        catch (Exception ex)
        {
            // Log error but don't fail the upload
            Console.WriteLine($"Failed to send dataset to ML service: {ex.Message}");
        }
    }

    public DateRangeValidation ValidateDateRanges(DateRangeRequest request)
    {
        if (_metadata == null || _currentDataset == null)
        {
            return new DateRangeValidation
            {
                IsValid = false,
                ErrorMessage = "No dataset loaded"
            };
        }

        // Validate date logic
        if (request.TrainingStart >= request.TrainingEnd ||
            request.TestingStart >= request.TestingEnd ||
            request.SimulationStart >= request.SimulationEnd)
        {
            return new DateRangeValidation
            {
                IsValid = false,
                ErrorMessage = "Start dates must be before end dates"
            };
        }

        if (request.TestingStart <= request.TrainingEnd ||
            request.SimulationStart <= request.TestingEnd)
        {
            return new DateRangeValidation
            {
                IsValid = false,
                ErrorMessage = "Date ranges must be sequential and non-overlapping"
            };
        }

        // Validate against dataset range
        if (request.TrainingStart < _metadata.EarliestTimestamp ||
            request.SimulationEnd > _metadata.LatestTimestamp)
        {
            return new DateRangeValidation
            {
                IsValid = false,
                ErrorMessage = "Selected dates must be within the dataset range"
            };
        }

        // Count records in each range
        var data = (List<Dictionary<string, object>>)_currentDataset["data"];
        
        var trainingRecords = data.Count(r => 
        {
            var timestamp = DateTime.Parse(r["synthetic_timestamp"].ToString());
            return timestamp >= request.TrainingStart && timestamp <= request.TrainingEnd;
        });

        var testingRecords = data.Count(r => 
        {
            var timestamp = DateTime.Parse(r["synthetic_timestamp"].ToString());
            return timestamp >= request.TestingStart && timestamp <= request.TestingEnd;
        });

        var simulationRecords = data.Count(r => 
        {
            var timestamp = DateTime.Parse(r["synthetic_timestamp"].ToString());
            return timestamp >= request.SimulationStart && timestamp <= request.SimulationEnd;
        });

        return new DateRangeValidation
        {
            IsValid = true,
            TrainingRecords = trainingRecords,
            TestingRecords = testingRecords,
            SimulationRecords = simulationRecords,
            TrainingDays = (request.TrainingEnd - request.TrainingStart).Days + 1,
            TestingDays = (request.TestingEnd - request.TestingStart).Days + 1,
            SimulationDays = (request.SimulationEnd - request.SimulationStart).Days + 1
        };
    }

    public DatasetMetadata? GetMetadata() => _metadata;
}