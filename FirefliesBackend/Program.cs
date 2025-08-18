using FirefliesBackend.Data;
using FirefliesBackend.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// EF Core - MySQL
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    )
);

// Fireflies options from config / env
builder.Services.Configure<FirefliesOptions>(builder.Configuration.GetSection("Fireflies"));

// Register Fireflies HTTP client
builder.Services.AddHttpClient<IFirefliesClient, FirefliesClient>(client =>
{
    client.BaseAddress = new Uri("https://api.fireflies.ai/");
    client.DefaultRequestHeaders.Accept.Add(
        new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json")
    );
});

// Register OpenAI HTTP client
builder.Services.AddHttpClient("OpenAI", client =>
{
    client.BaseAddress = new Uri("https://api.openai.com/");
    client.DefaultRequestHeaders.Accept.Add(
        new System.Net.Http.Headers.MediaTypeWithQualityHeaderValue("application/json")
    );
});

// CORS for React dev
builder.Services.AddCors(o => o.AddPolicy("AllowReactDev", p =>
    p.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()
));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors("AllowReactDev");
app.UseAuthorization();
app.MapControllers();

app.Run();  
