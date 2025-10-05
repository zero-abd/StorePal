# 🚀 Quick Reference Card

## One-Time Setup (5 minutes)

```bash
# 1. Add to .env file
echo "PINECONE_API_KEY=your_key_here" >> backend/.env

# 2. Install dependencies
cd backend
pip install -r requirements.txt

# 3. Upload data
python pinecone/upload_data.py

# 4. Start server
python main.py
```

## Test It Works

```bash
# Check health
curl http://localhost:8000/health
# Should show: "vector_search_enabled": true

# Test search
curl "http://localhost:8000/search?q=organic+oranges&top_k=3"
```

## Common Queries

Ask the agent:
- "Where can I find organic oranges?"
- "Do you have any cheese?"
- "I need ingredients for pasta"
- "What's in aisle B2?"
- "Show me products in the Produce section"

## Search Methods (Python)

```python
from pinecone.vector_search import VectorSearchEngine

engine = VectorSearchEngine()

# 1. Basic search
results = engine.semantic_search("oranges", top_k=5)

# 2. Best accuracy (RECOMMENDED)
results = engine.search_with_reranking("salad", top_k=20, top_n=5)

# 3. Filter by category
results = engine.search_with_filter("cheese", category="Dairy")

# 4. Filter by aisle
results = engine.search_with_filter("snacks", aisle="H1")

# 5. Browse category
results = engine.search_by_category("Produce", top_k=10)

# 6. Browse aisle
results = engine.search_by_aisle("A1", top_k=10)

# 7. Multi-query
results = engine.multi_query_search(["lettuce", "tomatoes", "dressing"])

# 8. Recommendations
results = engine.get_product_recommendations("Organic Bananas")

# Format for AI
response = engine.format_results_for_agent(results)
```

## SearchResult Object

```python
result.product_id        # int
result.item_name         # str
result.category          # str
result.description       # str
result.aisle_location    # str
result.score             # float
result.chunk_text        # str

# Methods
result.to_dict()              # → dict
result.to_natural_language()  # → str
```

## Quick Functions

```python
from pinecone.vector_search import quick_search, search_and_format

# Quick search
results = quick_search("pasta", top_k=5)

# Search and get formatted text
response = search_and_format("fruit", top_k=3)
```

## API Endpoints

```bash
# Health check
GET http://localhost:8000/health

# Product search
GET http://localhost:8000/search?q=oranges&top_k=5

# WebSocket for conversation
ws://localhost:8000/ws/conversation
```

## File Locations

```
backend/
├── pinecone/
│   ├── upload_data.py           # Upload script
│   ├── vector_search.py         # Search engine
│   ├── example_usage.py         # Examples
│   ├── README.md                # Full docs
│   └── QUICK_REFERENCE.md       # This file
├── data/
│   └── winmart_inventory.csv    # Product data
├── main.py                      # Server (updated)
├── requirements.txt             # Dependencies (updated)
├── PINECONE_SETUP.md           # Setup guide
└── .env                         # API keys (add PINECONE_API_KEY)
```

## Troubleshooting One-Liners

```bash
# Check if Pinecone is working
python -c "from pinecone.vector_search import VectorSearchEngine; e = VectorSearchEngine(); print('✅ Working!')"

# Re-upload data
python pinecone/upload_data.py

# Test search directly
python pinecone/vector_search.py

# Run examples
python pinecone/example_usage.py
```

## Configuration Values

| Setting | Value | Location |
|---------|-------|----------|
| Index Name | `winmart-inventory` | `upload_data.py` |
| Namespace | `winmart-products` | `upload_data.py` |
| Embedding Model | `llama-text-embed-v2` | `upload_data.py` |
| Cloud/Region | AWS / us-east-1 | `upload_data.py` |
| Vector Dimension | 1024 | Auto (from model) |
| Total Products | 500+ | `winmart_inventory.csv` |

## Categories in Database

- Produce
- Dairy
- Frozen
- Meat
- Seafood
- Bakery
- Canned Goods
- Dry Goods
- Snacks
- Beverages
- Breakfast
- Condiments

## Aisles in Database

Format: `[A-K][1-10]` (e.g., A1, B2, C3, etc.)

## Example Interactions

| User Says | Agent Finds | Aisle |
|-----------|-------------|-------|
| "organic oranges" | Valencia Oranges, Navel Oranges | A2 |
| "cheese" | Cheddar, Mozzarella, Swiss | B5-B7 |
| "pasta" | Spaghetti, Penne, Fettuccine | G1-G2 |
| "ice cream" | Vanilla, Chocolate, Strawberry | C9-C10 |
| "bread" | White, Wheat, Sourdough | E1-E2 |

## Performance Tips

✅ **DO**:
- Use `search_with_reranking()` for best accuracy
- Filter by category/aisle when possible
- Use natural language queries
- Set `top_k=20, top_n=5` for reranking

❌ **DON'T**:
- Use vague single-word queries
- Skip reranking for important searches
- Set `top_k` too low (< 5)
- Forget to wait 10 seconds after upload

## Need Help?

📖 Full Documentation: `backend/pinecone/README.md`
📖 Setup Guide: `backend/PINECONE_SETUP.md`
📖 Implementation Details: `backend/pinecone/IMPLEMENTATION_SUMMARY.md`
🧪 Examples: `python backend/pinecone/example_usage.py`

## Success Checklist

- [ ] `PINECONE_API_KEY` in `.env`
- [ ] `pip install -r requirements.txt`
- [ ] `python pinecone/upload_data.py` completed
- [ ] Health endpoint shows `vector_search_enabled: true`
- [ ] Search API returns results
- [ ] Agent responds to product queries

---

**That's it! You're ready to use intelligent product search! 🎉**

