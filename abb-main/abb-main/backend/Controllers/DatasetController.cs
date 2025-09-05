using Microsoft.AspNetCore.Mvc;
using IntelliInspectApi.Models;
using IntelliInspectApi.Services;

namespace IntelliInspectApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DatasetController : ControllerBase
{
    private readonly DatasetService _datasetService;

    public DatasetController(DatasetService datasetService)
    {
        _datasetService = datasetService;
    }

    [HttpPost("upload")]
    public async Task<ActionResult<DatasetMetadata>> UploadDataset([FromForm] IFormFile file)
    {
        try
        {
            var metadata = await _datasetService.ProcessDatasetAsync(file);
            return Ok(metadata);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to process dataset", details = ex.Message });
        }
    }

    [HttpPost("validate-ranges")]
    public ActionResult<DateRangeValidation> ValidateRanges([FromBody] DateRangeRequest request)
    {
        try
        {
            var validation = _datasetService.ValidateDateRanges(request);
            return Ok(validation);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Failed to validate date ranges", details = ex.Message });
        }
    }

    [HttpGet("metadata")]
    public ActionResult<DatasetMetadata> GetMetadata()
    {
        var metadata = _datasetService.GetMetadata();
        if (metadata == null)
        {
            return NotFound(new { error = "No dataset loaded" });
        }
        return Ok(metadata);
    }
}