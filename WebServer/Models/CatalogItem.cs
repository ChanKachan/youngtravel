namespace WebServer.Models
{
    public class CatalogItem
    {
        public int Id { get; set; }
        public int Cost { get; set; }
        public string City { get; set; }
        public string Name { get; set; }
        public string UserEmail { get; set; }
        public string Description { get; set; }
        public string Photo { get; set; }
        public string Period { get; set; }
        public DateTime In { get; set; }
        public DateTime Out { get; set; }
    }

    public class AddCatalogResponse
    {
        public int Id { get; set; }
        public string Message { get; set; }
    }
}
