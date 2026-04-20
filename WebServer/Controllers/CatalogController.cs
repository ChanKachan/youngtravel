using Microsoft.AspNetCore.Mvc;
using Npgsql;
using System.Text;
using WebServer.Models;

namespace WebServer.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CatalogController : ControllerBase
    {
        private readonly string _connectionString;

        public CatalogController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
        }

        [HttpGet]
        public async Task<IActionResult> GetCatalog()
        {
            var products = new List<object>();

            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            const string sql = @"
                SELECT id, cost, city, user_email, description, photo, name, date_in, date_out
                FROM public.catalog
                ORDER BY id DESC";

            await using var cmd = new NpgsqlCommand(sql, conn);
            await using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                products.Add(new
                {
                    Id = reader.GetInt32(0),
                    Cost = reader.GetInt32(1),
                    City = reader.GetString(2),
                    UserEmail = reader.GetString(3),
                    Description = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                    Photo = reader.GetString(5),
                    Name = reader.GetString(6),
                    Period = Utils.ParseDateTimeToString(reader.GetDateTime(7), reader.GetDateTime(8))
                });
            }

            return Ok(products);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetCatalogItem(int id)
        {
            await using var conn = new NpgsqlConnection(_connectionString);
            await conn.OpenAsync();

            const string sql = @"
                SELECT id, cost, city, user_email, description, photo, name, date_in, date_out
                FROM public.catalog
                WHERE id = @id";

            await using var cmd = new NpgsqlCommand(sql, conn);
            cmd.Parameters.AddWithValue("@id", id);

            await using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return NotFound($"Tour with id={id} was not found.");
            }

            return Ok(new
            {
                Id = reader.GetInt32(0),
                Cost = reader.GetInt32(1),
                City = reader.GetString(2),
                UserEmail = reader.GetString(3),
                Description = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                Photo = reader.GetString(5),
                Name = reader.GetString(6),
                Period = Utils.ParseDateTimeToString(reader.GetDateTime(7), reader.GetDateTime(8))
            });
        }

        [HttpGet("tooltip/{id:int}")]
        public async Task<IActionResult> GetTourTooltip(int id)
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string sql = @"
                    SELECT id, name, cost, city, description, photo, date_in, date_out
                    FROM public.catalog
                    WHERE id = @id";

                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@id", id);

                await using var reader = await cmd.ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    return NotFound(new { error = $"Tour with id={id} was not found." });
                }

                return Ok(new
                {
                    Id = reader.GetInt32(0),
                    Name = reader.GetString(1),
                    Cost = reader.GetInt32(2),
                    City = reader.GetString(3),
                    Description = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                    Photo = reader.GetString(5),
                    DateIn = reader.GetDateTime(6),
                    DateOut = reader.GetDateTime(7),
                    AvailableHotels = new[] { "3★", "4★", "5★" },
                    MealTypes = new[] { "Завтраки", "Полупансион", "Все включено" }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("batch-tooltip")]
        public async Task<IActionResult> GetBatchTourTooltip([FromQuery] string? ids)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(ids))
                {
                    return Ok(Array.Empty<object>());
                }

                var parsedIds = ids
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => int.TryParse(x, out var value) ? value : (int?)null)
                    .Where(x => x.HasValue)
                    .Select(x => x!.Value)
                    .Distinct()
                    .ToArray();

                if (parsedIds.Length == 0)
                {
                    return Ok(Array.Empty<object>());
                }

                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string sql = @"
                    SELECT id, name, cost, city, description, photo, date_in, date_out
                    FROM public.catalog
                    WHERE id = ANY(@ids)";

                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@ids", parsedIds);

                await using var reader = await cmd.ExecuteReaderAsync();
                var tours = new List<object>();

                while (await reader.ReadAsync())
                {
                    tours.Add(new
                    {
                        Id = reader.GetInt32(0),
                        Name = reader.GetString(1),
                        Cost = reader.GetInt32(2),
                        City = reader.GetString(3),
                        Description = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                        Photo = reader.GetString(5),
                        DateIn = reader.GetDateTime(6),
                        DateOut = reader.GetDateTime(7),
                        AvailableHotels = new[] { "3★", "4★", "5★" },
                        MealTypes = new[] { "Завтраки", "Полупансион", "Все включено" }
                    });
                }

                return Ok(tours);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("filter-options")]
        public async Task<IActionResult> GetFilterOptions()
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string sql = @"
                    SELECT
                        COALESCE(MIN(cost), 0),
                        COALESCE(MAX(cost), 500000),
                        COALESCE(MIN((date_out::date - date_in::date)), 1),
                        COALESCE(MAX((date_out::date - date_in::date)), 30)
                    FROM public.catalog";

                await using var cmd = new NpgsqlCommand(sql, conn);
                await using var reader = await cmd.ExecuteReaderAsync();

                await reader.ReadAsync();
                var minPrice = reader.GetInt32(0);
                var maxPrice = reader.GetInt32(1);
                var minDuration = reader.GetInt32(2);
                var maxDuration = reader.GetInt32(3);

                return Ok(new Dictionary<string, object>
                {
                    ["PriceRange"] = new Dictionary<string, int>
                    {
                        ["Min"] = minPrice,
                        ["Max"] = maxPrice
                    },
                    ["DurationRange"] = new Dictionary<string, int>
                    {
                        ["Min"] = minDuration,
                        ["Max"] = maxDuration
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("filter")]
        public async Task<IActionResult> GetFilteredCatalog(
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] int? minDuration = null,
            [FromQuery] int? maxDuration = null,
            [FromQuery] string? city = null,
            [FromQuery] string? type = null,
            [FromQuery] string? sortBy = null,
            [FromQuery] string? sortOrder = "asc",
            [FromQuery] string? search = null)
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                var sql = new StringBuilder(@"
                    SELECT
                        id,
                        name,
                        cost,
                        city,
                        user_email,
                        description,
                        photo,
                        date_in,
                        date_out,
                        (date_out::date - date_in::date) AS duration
                    FROM public.catalog
                    WHERE 1 = 1");

                var parameters = new List<NpgsqlParameter>();

                if (minPrice.HasValue && minPrice.Value > 0)
                {
                    sql.Append(" AND cost >= @minPrice");
                    parameters.Add(new NpgsqlParameter("@minPrice", minPrice.Value));
                }

                if (maxPrice.HasValue && maxPrice.Value > 0)
                {
                    sql.Append(" AND cost <= @maxPrice");
                    parameters.Add(new NpgsqlParameter("@maxPrice", maxPrice.Value));
                }

                if (!string.IsNullOrWhiteSpace(city))
                {
                    sql.Append(" AND LOWER(city) = LOWER(@city)");
                    parameters.Add(new NpgsqlParameter("@city", city.Trim()));
                }

                if (!string.IsNullOrWhiteSpace(type))
                {
                    sql.Append(" AND LOWER(description) LIKE LOWER(@type)");
                    parameters.Add(new NpgsqlParameter("@type", $"%{type.Trim()}%"));
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    sql.Append(" AND (LOWER(name) LIKE LOWER(@search) OR LOWER(city) LIKE LOWER(@search))");
                    parameters.Add(new NpgsqlParameter("@search", $"%{search.Trim()}%"));
                }

                if (minDuration.HasValue && minDuration.Value > 0)
                {
                    sql.Append(" AND (date_out::date - date_in::date) >= @minDuration");
                    parameters.Add(new NpgsqlParameter("@minDuration", minDuration.Value));
                }

                if (maxDuration.HasValue && maxDuration.Value > 0)
                {
                    sql.Append(" AND (date_out::date - date_in::date) <= @maxDuration");
                    parameters.Add(new NpgsqlParameter("@maxDuration", maxDuration.Value));
                }

                var orderBy = (sortBy ?? string.Empty).ToLowerInvariant();
                var order = (sortOrder ?? "asc").ToLowerInvariant() == "desc" ? "DESC" : "ASC";

                sql.Append(orderBy switch
                {
                    "price" => $" ORDER BY cost {order}",
                    "duration" => $" ORDER BY duration {order}",
                    "name" => $" ORDER BY name {order}",
                    _ => " ORDER BY id DESC"
                });

                await using var cmd = new NpgsqlCommand(sql.ToString(), conn);
                cmd.Parameters.AddRange(parameters.ToArray());

                await using var reader = await cmd.ExecuteReaderAsync();
                var products = new List<object>();

                while (await reader.ReadAsync())
                {
                    products.Add(new
                    {
                        Id = reader.GetInt32(0),
                        Name = reader.GetString(1),
                        Cost = reader.GetInt32(2),
                        City = reader.GetString(3),
                        UserEmail = reader.GetString(4),
                        Description = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                        Photo = reader.GetString(6),
                        DateIn = reader.GetDateTime(7),
                        DateOut = reader.GetDateTime(8),
                        Duration = reader.GetInt32(9)
                    });
                }

                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchTours([FromQuery] string? q)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
                {
                    return Ok(Array.Empty<object>());
                }

                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string sql = @"
                    SELECT id, name, cost, city, description, photo, date_in, date_out
                    FROM public.catalog
                    WHERE LOWER(name) LIKE LOWER(@search)
                       OR LOWER(city) LIKE LOWER(@search)
                    ORDER BY
                        CASE
                            WHEN LOWER(city) = LOWER(@exactCity) THEN 1
                            WHEN LOWER(name) LIKE LOWER(@startsWithName) THEN 2
                            ELSE 3
                        END
                    LIMIT 20";

                await using var cmd = new NpgsqlCommand(sql, conn);
                cmd.Parameters.AddWithValue("@search", $"%{q}%");
                cmd.Parameters.AddWithValue("@exactCity", q.Trim());
                cmd.Parameters.AddWithValue("@startsWithName", $"{q.Trim()}%");

                await using var reader = await cmd.ExecuteReaderAsync();
                var results = new List<object>();

                while (await reader.ReadAsync())
                {
                    results.Add(new
                    {
                        Id = reader.GetInt32(0),
                        Name = reader.GetString(1),
                        Cost = reader.GetInt32(2),
                        City = reader.GetString(3),
                        Description = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                        Photo = reader.GetString(5),
                        DateIn = reader.GetDateTime(6),
                        DateOut = reader.GetDateTime(7)
                    });
                }

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddCatalog([FromBody] CatalogItem? catalogItem)
        {
            try
            {
                if (catalogItem == null)
                {
                    return BadRequest(new { error = "Request body is empty." });
                }

                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(catalogItem.Photo))
                {
                    validationErrors.Add("Photo is required.");
                }

                if (string.IsNullOrWhiteSpace(catalogItem.Name))
                {
                    validationErrors.Add("Name is required.");
                }
                else if (catalogItem.Name.Length is < 2 or > 100)
                {
                    validationErrors.Add("Name length must be between 2 and 100.");
                }

                if (string.IsNullOrWhiteSpace(catalogItem.City))
                {
                    validationErrors.Add("City is required.");
                }

                if (catalogItem.Cost <= 10000)
                {
                    validationErrors.Add("Cost must be greater than 10000.");
                }
                else if (catalogItem.Cost > 500000)
                {
                    validationErrors.Add("Cost must be less than or equal to 500000.");
                }

                if (string.IsNullOrWhiteSpace(catalogItem.UserEmail) || !Utils.IsValidEmail(catalogItem.UserEmail))
                {
                    validationErrors.Add("UserEmail is invalid.");
                }

                if (!string.IsNullOrWhiteSpace(catalogItem.Description) && catalogItem.Description.Length > 1000)
                {
                    validationErrors.Add("Description length must be less than or equal to 1000.");
                }

                if (string.IsNullOrWhiteSpace(catalogItem.Period))
                {
                    validationErrors.Add("Period is required.");
                }
                else
                {
                    try
                    {
                        var dates = Utils.ParseStringToDateTime(catalogItem.Period);
                        catalogItem.In = dates[0];
                        catalogItem.Out = dates[1];

                        if (catalogItem.In >= catalogItem.Out)
                        {
                            validationErrors.Add("Date start must be earlier than date end.");
                        }

                        if (catalogItem.In.Date < DateTime.Today)
                        {
                            validationErrors.Add("Start date cannot be in the past.");
                        }
                    }
                    catch
                    {
                        validationErrors.Add("Period format must be dd.MM.yyyy-dd.MM.yyyy.");
                    }
                }

                if (validationErrors.Count > 0)
                {
                    return BadRequest(new { errors = validationErrors });
                }

                await using (var checkConn = new NpgsqlConnection(_connectionString))
                {
                    await checkConn.OpenAsync();

                    const string checkSql = @"
                        SELECT COUNT(*)
                        FROM public.catalog
                        WHERE LOWER(name) = LOWER(@name)
                          AND (
                              (date_in BETWEEN @date_in AND @date_out)
                              OR (date_out BETWEEN @date_in AND @date_out)
                              OR (@date_in BETWEEN date_in AND date_out)
                          )";

                    await using var checkCmd = new NpgsqlCommand(checkSql, checkConn);
                    checkCmd.Parameters.AddWithValue("@name", catalogItem.Name.Trim());
                    checkCmd.Parameters.AddWithValue("@date_in", catalogItem.In);
                    checkCmd.Parameters.AddWithValue("@date_out", catalogItem.Out);

                    var existingCount = Convert.ToInt32(await checkCmd.ExecuteScalarAsync());
                    if (existingCount > 0)
                    {
                        return Conflict(new { error = $"Tour '{catalogItem.Name}' already exists for selected dates." });
                    }
                }

                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var transaction = await conn.BeginTransactionAsync();

                try
                {
                    const string insertSql = @"
                        INSERT INTO public.catalog
                        (photo, name, city, cost, user_email, description, date_in, date_out)
                        VALUES
                        (@photo, @name, @city, @cost, @user_email, @description, @date_in, @date_out)
                        RETURNING id";

                    await using var cmd = new NpgsqlCommand(insertSql, conn, transaction);
                    cmd.Parameters.AddWithValue("@photo", catalogItem.Photo.Trim());
                    cmd.Parameters.AddWithValue("@name", catalogItem.Name.Trim());
                    cmd.Parameters.AddWithValue("@city", catalogItem.City.Trim());
                    cmd.Parameters.AddWithValue("@cost", catalogItem.Cost);
                    cmd.Parameters.AddWithValue("@user_email", catalogItem.UserEmail.Trim().ToLowerInvariant());
                    cmd.Parameters.AddWithValue("@description",
                        string.IsNullOrWhiteSpace(catalogItem.Description)
                            ? DBNull.Value
                            : catalogItem.Description.Trim());
                    cmd.Parameters.AddWithValue("@date_in", catalogItem.In);
                    cmd.Parameters.AddWithValue("@date_out", catalogItem.Out);

                    var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                    await transaction.CommitAsync();

                    return Ok(new AddCatalogResponse
                    {
                        Id = newId,
                        Message = "Tour created successfully."
                    });
                }
                catch
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            }
            catch (PostgresException pgEx)
            {
                return StatusCode(500, new { error = pgEx.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}
