# Pinecone Vector Search Integration

This directory contains the Pinecone vector search integration for StorePal's WinMart inventory system.

## 📁 Files Overview

- **`upload_data.py`**: Standalone script to upload WinMart inventory data to Pinecone
- **`vector_search.py`**: Class-based vector search engine with multiple search methodologies
- **`__init__.py`**: Package initialization file

## 🚀 Quick Start

### 1. Prerequisites

Make sure you have the following in your `.env` file:

```bash
PINECONE_API_KEY=your_pinecone_api_key_here
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id
```

### 2. Install Dependencies

```bash
pip install -r ../requirements.txt
```

### 3. Upload Inventory Data

Run the upload script to create the Pinecone index and upload all WinMart products:

```bash
python upload_data.py
```

This will:
- Create a Pinecone index named `winmart-inventory`
- Use the `llama-text-embed-v2` embedding model
- Upload 500+ products from `data/winmart_inventory.csv`
- Create embeddings automatically using Pinecone's integrated model
- Test the search functionality

**Note**: The script will ask if you want to recreate the index if it already exists.

### 4. Test Vector Search

Test the vector search engine independently:

```bash
python vector_search.py
```

This runs several test queries to verify the search functionality.

## 🔍 Search Methodologies

The `VectorSearchEngine` class provides multiple search methods:

### 1. Semantic Search
Basic semantic search using vector similarity:

```python
from pinecone.vector_search import VectorSearchEngine

engine = VectorSearchEngine()
results = engine.semantic_search("organic oranges", top_k=5)

for result in results:
    print(f"{result.item_name} - Aisle {result.aisle_location}")
```

### 2. Search with Filtering
Filter by category or aisle location:

```python
# Search within a specific category
results = engine.search_with_filter(
    query="cheese",
    category="Dairy",
    top_k=5
)

# Search within a specific aisle
results = engine.search_with_filter(
    query="snacks",
    aisle="H1",
    top_k=5
)
```

### 3. Search with Reranking
Improved accuracy using reranking (recommended for best results):

```python
results = engine.search_with_reranking(
    query="ingredients for a salad",
    top_k=20,    # Initial retrieval
    top_n=5      # Final results after reranking
)
```

### 4. Category Search
Browse or search within a category:

```python
# Browse all Produce
results = engine.search_by_category("Produce", top_k=10)

# Search within Produce
results = engine.search_by_category("Produce", query="fresh fruit", top_k=5)
```

### 5. Aisle Search
Browse or search within a specific aisle:

```python
# Browse aisle A1
results = engine.search_by_aisle("A1", top_k=10)

# Search within aisle A1
results = engine.search_by_aisle("A1", query="organic", top_k=5)
```

### 6. Multi-Query Search
Combine results from multiple queries:

```python
queries = [
    "lettuce and tomatoes",
    "salad dressing",
    "croutons"
]
results = engine.multi_query_search(queries, top_k_per_query=3)
```

### 7. Product Recommendations
Find similar products:

```python
results = engine.get_product_recommendations("Organic Bananas", top_k=5)
```

## 📊 Search Results

All search methods return a list of `SearchResult` objects with these attributes:

```python
class SearchResult:
    product_id: int              # Unique product ID
    item_name: str              # Product name
    category: str               # Product category
    description: str            # Product description
    aisle_location: str         # Aisle location (e.g., "A1")
    score: float                # Similarity score
    chunk_text: str             # Full text used for embedding
```

## 🤖 Integration with ElevenLabs Agent

The vector search is automatically integrated with the main StorePal agent in `main.py`:

1. **Automatic Product Search**: When users ask about products, the system automatically searches the inventory
2. **Natural Language Responses**: Search results are formatted as natural language for the AI agent
3. **Real-time Updates**: Product information is sent to the frontend via WebSocket

### Agent Behavior

The agent will automatically search for products when users say things like:
- "Where can I find organic oranges?"
- "Do you have any cheese?"
- "I need ingredients for pasta"
- "Show me products in aisle B2"
- "What's available in the Dairy section?"

## 🌐 API Endpoints

The main application provides these endpoints:

### GET `/health`
Check system status:

```bash
curl http://localhost:8000/health
```

Response:
```json
{
  "status": "healthy",
  "api_configured": true,
  "vector_search_enabled": true
}
```

### GET `/search?q=<query>&top_k=<number>`
Search for products directly:

```bash
curl "http://localhost:8000/search?q=organic%20oranges&top_k=5"
```

Response:
```json
{
  "query": "organic oranges",
  "results": [
    {
      "product_id": 8,
      "item_name": "Navel Oranges",
      "category": "Produce",
      "description": "Easy to peel oranges packed with vitamin C",
      "aisle_location": "A2",
      "score": 0.85,
      "chunk_text": "..."
    }
  ],
  "formatted_response": "I found..."
}
```

## 🔧 Configuration

### Index Configuration

Default settings (can be modified in `upload_data.py`):

```python
INDEX_NAME = "winmart-inventory"
EMBEDDING_MODEL = "llama-text-embed-v2"  # Pinecone integrated model
CLOUD = "aws"
REGION = "us-east-1"
NAMESPACE = "winmart-products"
```

### Search Parameters

Default parameters (can be customized):

```python
VectorSearchEngine(
    index_name="winmart-inventory",
    namespace="winmart-products",
    api_key=None  # Uses PINECONE_API_KEY from .env if None
)
```

## 📈 Performance Tips

1. **Use Reranking**: For best accuracy, use `search_with_reranking()` instead of basic semantic search
2. **Filter When Possible**: Use category/aisle filters to narrow down results
3. **Adjust top_k**: Retrieve more candidates initially (top_k=20) and rerank to fewer (top_n=5)
4. **Batch Uploads**: When uploading large datasets, the script uses batch size of 100

## 🧪 Testing

### Test Upload Script
```bash
python upload_data.py
```

### Test Vector Search
```bash
python vector_search.py
```

### Test via API
```bash
# Start the server
python ../main.py

# In another terminal
curl "http://localhost:8000/search?q=organic+fruit&top_k=3"
```

## 📝 Data Format

The CSV file should have these columns:
- `id`: Unique product ID
- `item_name`: Product name
- `category`: Product category
- `description`: Product description
- `aisle_location`: Aisle location (e.g., "A1")

Example:
```csv
id,item_name,category,description,aisle_location
1,Organic Bananas,Produce,Fresh yellow bananas perfect for snacking,A1
2,Red Delicious Apples,Produce,Crisp and sweet apples great for lunch boxes,A1
```

## 🚨 Troubleshooting

### "PINECONE_API_KEY not found"
Make sure your `.env` file contains `PINECONE_API_KEY=...`

### "Index not found"
Run `upload_data.py` to create the index

### "Vector search not available"
The main app will run without Pinecone if it's not configured. Check:
1. PINECONE_API_KEY is set in `.env`
2. Index has been created with `upload_data.py`
3. Dependencies are installed

### Low Search Quality
1. Try using `search_with_reranking()` instead of basic search
2. Increase `top_k` to retrieve more candidates
3. Use filters to narrow down search space
4. Check if your query is too vague or too specific

## 🔐 Security Notes

- Never commit your `.env` file with API keys
- API keys are loaded from environment variables
- Pinecone connection uses secure HTTPS

## 📚 Additional Resources

- [Pinecone Documentation](https://docs.pinecone.io/)
- [Pinecone Python SDK](https://docs.pinecone.io/reference/python-sdk)
- [Vector Search Best Practices](https://www.pinecone.io/learn/vector-search/)
- [Reranking for Improved Accuracy](https://www.pinecone.io/learn/reranking/)

