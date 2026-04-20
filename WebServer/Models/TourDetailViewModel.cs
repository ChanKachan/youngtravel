using System;
using System.Collections.Generic;

namespace WebServer.Models
{
    public class TourDetailViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public int Cost { get; set; }
        public string City { get; set; }
        public string UserEmail { get; set; }
        public string Description { get; set; }
        public string Photo { get; set; }
        public string Period { get; set; }
        public DateTime DateIn { get; set; }
        public DateTime DateOut { get; set; }
        public int Duration { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public List<ReviewViewModel> Reviews { get; set; }
    }

    public class ReviewViewModel
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Text { get; set; }
        public int Stars { get; set; }
        public DateTime CreateDate { get; set; }
    }
}