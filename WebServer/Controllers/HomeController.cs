using Microsoft.AspNetCore.Mvc;

namespace WebServer.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index() => Redirect("/index.html");

        public IActionResult About() => Redirect("/about.html");
    }
}
