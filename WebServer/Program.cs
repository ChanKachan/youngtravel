var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = context =>
    {
        var path = context.Context.Request.Path.Value ?? string.Empty;

        if (path.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.ContentType = "text/html; charset=utf-8";
        }
        else if (path.EndsWith(".css", StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.ContentType = "text/css; charset=utf-8";
        }
        else if (path.EndsWith(".js", StringComparison.OrdinalIgnoreCase))
        {
            context.Context.Response.ContentType = "application/javascript; charset=utf-8";
        }
    }
});
app.UseRouting();

app.MapControllers();
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}"
);

app.Run();
