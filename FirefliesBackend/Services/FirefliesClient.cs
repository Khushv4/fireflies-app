using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;

namespace FirefliesBackend.Services
{
    public class FirefliesOptions { public string ApiKey { get; set; } }

    public class FirefliesClient : IFirefliesClient
    {
        private readonly HttpClient _http;
        private readonly FirefliesOptions _opts;

        public FirefliesClient(HttpClient http, IOptions<FirefliesOptions> opts)
        {
            _http = http;
            _opts = opts.Value ?? throw new ArgumentNullException(nameof(opts));
            if (string.IsNullOrWhiteSpace(_opts.ApiKey))
                throw new ArgumentException("Fireflies:ApiKey is not configured.");
        }

        public async Task<JsonDocument> QueryAsync(string graphqlQuery, object variables = null)
        {
            var payload = new { query = graphqlQuery, variables };
            using var req = new HttpRequestMessage(HttpMethod.Post, "graphql")
            {
                Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
            };
            req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _opts.ApiKey);

            using var res = await _http.SendAsync(req);
            res.EnsureSuccessStatusCode();
            await using var s = await res.Content.ReadAsStreamAsync();
            return await JsonDocument.ParseAsync(s);
        }
    }
}
