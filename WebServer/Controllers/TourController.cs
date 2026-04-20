using Microsoft.AspNetCore.Mvc;
using Npgsql;
using WebServer.Models;

namespace WebServer.Controllers
{
    public class TourController : Controller
    {
        private readonly string _connectionString;

        public TourController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection is not configured.");
        }

        [HttpGet("/tour.html")]
        public IActionResult TourHtml([FromQuery] int id = 0)
        {
            if (id <= 0)
            {
                return Redirect("/catalog.html");
            }

            return RedirectToAction(nameof(Details), new { id });
        }

        public async Task<IActionResult> Details(int id)
        {
            try
            {
                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string tourSql = @"
                    SELECT id, cost, city, user_email, description, photo, name, date_in, date_out
                    FROM public.catalog
                    WHERE id = @id";

                await using var tourCmd = new NpgsqlCommand(tourSql, conn);
                tourCmd.Parameters.AddWithValue("@id", id);

                await using var tourReader = await tourCmd.ExecuteReaderAsync();

                if (!await tourReader.ReadAsync())
                {
                    return NotFound($"Tour with id={id} was not found.");
                }

                var dateIn = tourReader.GetDateTime(7);
                var dateOut = tourReader.GetDateTime(8);
                var duration = (dateOut - dateIn).Days + 1;

                var tour = new TourDetailViewModel
                {
                    Id = tourReader.GetInt32(0),
                    Cost = tourReader.GetInt32(1),
                    City = tourReader.GetString(2),
                    UserEmail = tourReader.GetString(3),
                    Description = tourReader.IsDBNull(4) ? string.Empty : tourReader.GetString(4),
                    Photo = tourReader.GetString(5),
                    Name = tourReader.GetString(6),
                    DateIn = dateIn,
                    DateOut = dateOut,
                    Period = Utils.ParseDateTimeToString(dateIn, dateOut),
                    Duration = duration,
                    Reviews = new List<ReviewViewModel>()
                };

                await tourReader.CloseAsync();

                const string reviewsSql = @"
                    SELECT id, name, text, stars, create_date
                    FROM public.reviews
                    WHERE catalog_id = @catalog_id
                    ORDER BY create_date DESC";

                await using var reviewsCmd = new NpgsqlCommand(reviewsSql, conn);
                reviewsCmd.Parameters.AddWithValue("@catalog_id", id);

                await using var reviewsReader = await reviewsCmd.ExecuteReaderAsync();
                double totalStars = 0;

                while (await reviewsReader.ReadAsync())
                {
                    var review = new ReviewViewModel
                    {
                        Id = reviewsReader.GetInt32(0),
                        Name = reviewsReader.IsDBNull(1) ? "Аноним" : reviewsReader.GetString(1),
                        Text = reviewsReader.IsDBNull(2) ? string.Empty : reviewsReader.GetString(2),
                        Stars = reviewsReader.GetInt32(3),
                        CreateDate = reviewsReader.GetDateTime(4)
                    };

                    tour.Reviews.Add(review);
                    totalStars += review.Stars;
                }

                tour.TotalReviews = tour.Reviews.Count;
                tour.AverageRating = tour.Reviews.Count > 0 ? totalStars / tour.Reviews.Count : 0;

                return View(tour);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("tour/book")]
        public IActionResult Book([FromBody] BookingRequest? booking)
        {
            try
            {
                if (booking == null)
                {
                    return BadRequest(new { success = false, message = "Invalid booking payload." });
                }

                var errors = new List<string>();

                if (string.IsNullOrWhiteSpace(booking.Name))
                {
                    errors.Add("Name is required.");
                }

                if (string.IsNullOrWhiteSpace(booking.Phone))
                {
                    errors.Add("Phone is required.");
                }
                else if (!System.Text.RegularExpressions.Regex.IsMatch(booking.Phone, @"^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$"))
                {
                    errors.Add("Phone format must be +7 (XXX) XXX-XX-XX.");
                }

                if (string.IsNullOrWhiteSpace(booking.Email) || !Utils.IsValidEmail(booking.Email))
                {
                    errors.Add("Valid email is required.");
                }

                if (booking.Travelers <= 0)
                {
                    errors.Add("Travelers count must be greater than 0.");
                }

                if (errors.Count > 0)
                {
                    return BadRequest(new { success = false, errors });
                }

                return Ok(new
                {
                    success = true,
                    message = "Booking created successfully.",
                    bookingId = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost]
        [Route("tour/addreview")]
        public async Task<IActionResult> AddReview([FromBody] AddReviewRequest? review)
        {
            try
            {
                if (review == null)
                {
                    return BadRequest(new { success = false, message = "Invalid review payload." });
                }

                if (string.IsNullOrWhiteSpace(review.Text))
                {
                    return BadRequest(new { success = false, message = "Review text is required." });
                }

                if (review.Stars < 1 || review.Stars > 5)
                {
                    return BadRequest(new { success = false, message = "Stars must be from 1 to 5." });
                }

                if (review.CatalogId <= 0)
                {
                    return BadRequest(new { success = false, message = "CatalogId is required." });
                }

                await using var conn = new NpgsqlConnection(_connectionString);
                await conn.OpenAsync();

                const string insertSql = @"
                    INSERT INTO public.reviews (name, text, stars, catalog_id, create_date)
                    VALUES (@name, @text, @stars, @catalog_id, @create_date)
                    RETURNING id";

                await using var cmd = new NpgsqlCommand(insertSql, conn);
                cmd.Parameters.AddWithValue("@name", string.IsNullOrWhiteSpace(review.Name) ? DBNull.Value : review.Name.Trim());
                cmd.Parameters.AddWithValue("@text", review.Text.Trim());
                cmd.Parameters.AddWithValue("@stars", review.Stars);
                cmd.Parameters.AddWithValue("@catalog_id", review.CatalogId);
                cmd.Parameters.AddWithValue("@create_date", DateTime.UtcNow);

                var newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());

                return Ok(new
                {
                    success = true,
                    message = "Review added successfully.",
                    reviewId = newId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }

    public class BookingRequest
    {
        public int TourId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public int Travelers { get; set; }
        public string Comments { get; set; } = string.Empty;
    }
}
