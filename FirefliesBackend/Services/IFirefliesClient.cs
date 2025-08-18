using System.Text.Json;
using System.Threading.Tasks;

namespace FirefliesBackend.Services
{
    public interface IFirefliesClient
    {
        Task<JsonDocument> QueryAsync(string graphqlQuery, object variables = null);
    }
}

