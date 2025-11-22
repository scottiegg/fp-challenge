# Facility Search API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication

All facility endpoints require authentication using Bearer tokens.

### Login
Get an authentication token to access protected endpoints.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "Jane Doe",
    "membershipType": "premium",
    "memberSince": "2024-01-15"
  },
  "message": "Login successful"
}
```

**Note:** Use `password: "error"` to simulate failed login for testing.

---

## Facilities

### Search Facilities
Search for facilities by name with partial matching support.

**Endpoint:** `GET /api/facilities/search`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Query Parameters:**
- `q` (required): Search query string
- `amenities` (optional): Comma-separated list of amenities to filter by

**Example Requests:**
```bash
# Basic search
GET /api/facilities/search?q=City

# Search with amenity filter
GET /api/facilities/search?q=Fitness&amenities=Pool,Sauna
```

**Response (200 OK):**
```json
{
  "query": "City",
  "count": 2,
  "results": [
    {
      "id": "facility-001",
      "name": "City Fitness Central",
      "address": "123 Market St, Sydney, NSW 2000"
    },
    {
      "id": "facility-003",
      "name": "City Gym Plus",
      "address": "456 George St, Sydney, NSW 2000"
    }
  ]
}
```

**Search Features:**
- Case-insensitive matching
- Partial name matching (e.g., "City" matches "City Fitness Central")
- Multi-word query support
- Results sorted by relevance (exact matches first)
- Optimized for 100,000+ facilities

---

### Get Facility Details
Retrieve complete information about a specific facility.

**Endpoint:** `GET /api/facilities/:id`

**Headers:**
```
Authorization: Bearer <your-token>
```

**Path Parameters:**
- `id`: Facility ID

**Example Request:**
```bash
GET /api/facilities/facility-001
```

**Response (200 OK):**
```json
{
  "id": "facility-001",
  "name": "City Fitness Central",
  "address": "123 Market St, Sydney, NSW 2000",
  "location": {
    "latitude": -33.8703,
    "longitude": 151.208
  },
  "facilities": [
    "Pool",
    "Sauna",
    "24/7 Access",
    "Yoga Classes"
  ]
}
```

**Response (404 Not Found):**
```json
{
  "error": "Facility not found",
  "message": "No facility found with ID: invalid-id"
}
```

---

## Health Check

### Get API Health Status
Check if the API is running and healthy.

**Endpoint:** `GET /api/health`

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": "3600s",
  "service": "facility-search-api",
  "version": "1.0.0",
  "facilitiesLoaded": 100
}
```

---

## Error Responses

### 400 Bad Request
Invalid request parameters or body.

```json
{
  "error": "Invalid query parameters",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "path": ["q"],
      "message": "Query parameter \"q\" is required"
    }
  ]
}
```

### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "error": "Authentication required",
  "message": "No authorization header provided"
}
```

### 404 Not Found
Resource not found.

```json
{
  "error": "Not found",
  "message": "Route GET /api/undefined-route not found"
}
```

### 500 Internal Server Error
Server error occurred.

```json
{
  "error": "Internal server error",
  "message": "Error details..."
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Limit:** 100 requests per 15 minutes per IP address
- **Response (429):** "Too many requests from this IP, please try again later."

---

## Example Usage

### Complete Flow

```bash
# 1. Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Response: { "token": "eyJhbGc...", ... }

# 2. Search facilities
curl -X GET "http://localhost:3000/api/facilities/search?q=City" \
  -H "Authorization: Bearer eyJhbGc..."

# 3. Get facility details
curl -X GET http://localhost:3000/api/facilities/facility-001 \
  -H "Authorization: Bearer eyJhbGc..."

# 4. Search with amenity filter
curl -X GET "http://localhost:3000/api/facilities/search?q=Fitness&amenities=Pool,Sauna" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Performance Considerations

The API is designed for production use with large datasets:

1. **Indexing:** Facilities are indexed on startup for O(1) ID lookups
2. **Search Optimization:** Name tokens are pre-computed for fast partial matching
3. **Caching:** Service layer uses singleton pattern to avoid reloading data
4. **Rate Limiting:** Protects against abuse and ensures fair usage
5. **Scalability:** Architecture supports horizontal scaling

For datasets with 100,000+ facilities, the search remains performant through:
- Token-based indexing
- Efficient Set operations for matching
- Minimal memory overhead per facility
