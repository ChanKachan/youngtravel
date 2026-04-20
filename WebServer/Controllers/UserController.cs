using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace WebServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly string _connectionString;

        public UserController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
        }

        [HttpGet("{catalogId:int}")]
        public async Task<IActionResult> GetReviews(int catalogId)
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string sql = @"
                    SELECT id, name, text, stars, create_date
                    FROM public.reviews
                    WHERE catalog_id = @catalogId
                    ORDER BY create_date DESC";

                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@catalogId", catalogId);

                await using var reader = await cmd.ExecuteReaderAsync();
                var reviews = new List<object>();

                while (await reader.ReadAsync())
                {
                    reviews.Add(new
                    {
                        Id = reader.GetInt32(0),
                        UserName = reader.IsDBNull(1) ? "Аноним" : reader.GetString(1),
                        Text = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        Stars = reader.GetInt32(3),
                        Date = reader.GetDateTime(4)
                    });
                }

                return Ok(reviews);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddReview([FromBody] ReviewRequest? review)
        {
            try
            {
                if (review == null)
                {
                    return BadRequest(new { error = "Review payload is required." });
                }

                if (string.IsNullOrWhiteSpace(review.Text))
                {
                    return BadRequest(new { error = "Review text is required." });
                }

                if (review.Stars < 1 || review.Stars > 5)
                {
                    return BadRequest(new { error = "Stars must be from 1 to 5." });
                }

                if (review.CatalogId <= 0)
                {
                    return BadRequest(new { error = "CatalogId must be greater than 0." });
                }

                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string sql = @"
                    INSERT INTO public.reviews (name, text, stars, catalog_id, create_date)
                    VALUES (@name, @text, @stars, @catalogId, @createdAt)
                    RETURNING id";

                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@name",
                    string.IsNullOrWhiteSpace(review.Name) ? DBNull.Value : review.Name.Trim());
                cmd.Parameters.AddWithValue("@text", review.Text.Trim());
                cmd.Parameters.AddWithValue("@stars", review.Stars);
                cmd.Parameters.AddWithValue("@catalogId", review.CatalogId);
                cmd.Parameters.AddWithValue("@createdAt", DateTime.UtcNow);

                var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                return Ok(new
                {
                    id = newId,
                    message = "Review added successfully."
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }

    public class ReviewRequest
    {
        public string? Name { get; set; }
        public string Text { get; set; } = string.Empty;
        public int Stars { get; set; }
        public int CatalogId { get; set; }
    }
}
