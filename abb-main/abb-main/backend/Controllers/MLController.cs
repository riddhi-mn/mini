using Microsoft.AspNetCore.Mvc;
using IntelliInspectApi.Models;
using System.Text.Json;

namespace IntelliInspectApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MLController : ControllerBase
{
    private readonly HttpClient _httpClient;

    public MLController(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    [HttpPost("train")]
    public async Task<ActionResult<TrainingResult>> TrainModel([FromBody] TrainingRequest request)
    {
        try
        {
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync("http://ml_service:8000/train-model", content);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, new { error = "ML service error", details = errorContent });
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<TrainingResult>(responseContent, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to train model", details = ex.Message });
        }
    }

    [HttpGet("simulation/{simulationStart}/{simulationEnd}")]
    public async Task<ActionResult> GetSimulationData(string simulationStart, string simulationEnd)
    {
        try
        {
            var response = await _httpClient.GetAsync($"http://ml_service:8000/simulation/{simulationStart}/{simulationEnd}");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, new { error = "ML service error", details = errorContent });
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            return Ok(JsonSerializer.Deserialize<object>(responseContent));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to get simulation data", details = ex.Message });
        }
    }
}