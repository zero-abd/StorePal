# 🎯 Pinecone Setup Guide for StorePal

This guide will walk you through setting up Pinecone vector search for your WinMart inventory.

## 📋 Prerequisites

1. **Pinecone Account**: Sign up at [https://www.pinecone.io/](https://www.pinecone.io/)
2. **Python 3.8+**: Make sure you have Python installed
3. **API Keys**: You'll need your Pinecone API key

## 🔧 Step-by-Step Setup

### Step 1: Get Your Pinecone API Key

1. Go to [Pinecone Console](https://app.pinecone.io/)
2. Sign up or log in
3. Navigate to **API Keys** section
4. Copy your API key

### Step 2: Update Your .env File

Add the Pinecone API key to your `.env` file in the `backend` directory:

```bash
# Existing keys
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_AGENT_ID=your_agent_id

# Add this line
PINECONE_API_KEY=your_pinecone_api_key_here
```

### Step 3: Install Dependencies

Navigate to the backend directory and install the updated requirements:

```bash
cd backend
pip install -r requirements.txt
```

This will install:
- `pinecone==5.0.0` - Pinecone Python SDK
- `pandas==2.1.3` - For CSV data processing

### Step 4: Upload Your Inventory Data

Run the standalone upload script to create the Pinecone index and upload your WinMart inventory:

```bash
python pinecone/upload_data.py
```

**What this does:**
1. ✅ Validates your environment and API key
2. 📁 Loads the `data/winmart_inventory.csv` file (500+ products)
3. 🔄 Prepares records with rich text descriptions for embedding
4. 🚀 Creates a Pinecone index named `winmart-inventory`
5. ⬆️  Uploads all products in batches
6. 🔍 Verifies the upload
7. 🧪 Tests the search with a sample query

**Expected output:**
```
======================================================================
  🚀 WinMart Inventory Upload to Pinecone
======================================================================
✅ Environment validation passed
📁 Loading inventory data from ...
✅ Loaded 500 products
🔄 Preparing records for Pinecone...
✅ Prepared 500 records
🔌 Connecting to Pinecone...
✅ Connected to Pinecone
🔍 Checking for index 'winmart-inventory'...
🚀 Creating new index 'winmart-inventory' with integrated embedding model...
✅ Index 'winmart-inventory' created successfully
⬆️  Uploading 500 records to namespace 'winmart-products'...
✅ All records uploaded successfully!
🧪 Testing search functionality...
   Query: 'Where can I find organic oranges?'

📋 Top 5 results:
   1. Valencia Oranges
      Category: Produce
      Aisle: A2
      Score: 0.8523
      Description: Juicy oranges great for fresh juice

======================================================================
  ✅ Upload Complete!
======================================================================
```

### Step 5: Test the Vector Search

Test the vector search engine independently:

```bash
python pinecone/vector_search.py
```

This runs several test queries including:
- Semantic search for products
- Search with reranking
- Category filtering
- Formatted responses for the AI agent

### Step 6: Start Your StorePal Server

Now start the main application:

```bash
python main.py
```

You should see:
```
✅ Vector Search Engine initialized
========================================================
  🚀 StorePal Conversational Agent API - SERVER MODE
========================================================
```

### Step 7: Test the Integration

#### Option 1: Via Web Browser

1. Open `http://localhost:8000/health` in your browser

   You should see:
   ```json
   {
     "status": "healthy",
     "api_configured": true,
     "vector_search_enabled": true
   }
   ```

2. Test product search at `http://localhost:8000/search?q=organic%20oranges&top_k=5`

#### Option 2: Via Command Line

```bash
# Check health
curl http://localhost:8000/health

# Search for products
curl "http://localhost:8000/search?q=organic%20fruit&top_k=5"
```

#### Option 3: Via WebSocket (Frontend)

Connect to the WebSocket at `ws://localhost:8000/ws/conversation` and ask:
- "Where can I find organic oranges?"
- "Do you have any cheese?"
- "I need ingredients for a salad"
- "What's in aisle B2?"

## 🎯 How It Works

### User Query Flow

```
User asks: "Where can I find organic oranges?"
                    ↓
    ElevenLabs transcribes speech
                    ↓
    Agent detects product-related keywords
                    ↓
    Vector search finds relevant products
                    ↓
    Results formatted for natural response
                    ↓
    ElevenLabs generates speech response
```

### Automatic Product Search

The agent automatically searches for products when it detects keywords like:
- find, where, locate, aisle
- have, sell, carry, stock, available
- need, want, looking for
- show me, get me, buy, purchase

### Example Interactions

**User**: "Where can I find organic oranges?"

**Agent**: "I found Navel Oranges! They're in the Produce section, located in aisle A2. Easy to peel oranges packed with vitamin C."

---

**User**: "I need ingredients for pasta"

**Agent**: "I found 5 products that might help:

1. Spaghetti Pasta - Aisle G1
   Classic spaghetti pasta 16oz

2. Penne Pasta - Aisle G1
   Penne rigate pasta

3. Tomato Sauce - Aisle F5
   Plain tomato sauce 8oz

4. Parmesan Grated - Aisle B6
   Grated parmesan cheese container

5. Fresh Basil - Aisle A9
   Sweet basil for Italian dishes"

## 🔍 Available Search Methods

The system uses multiple search strategies:

1. **Semantic Search**: Understanding meaning, not just keywords
2. **Reranking**: Improving result accuracy with a second pass
3. **Filtering**: Search within specific categories or aisles
4. **Multi-Query**: Combining results from multiple searches
5. **Recommendations**: Finding similar products

## 🎨 Customization

### Change the Index Name

Edit `backend/pinecone/upload_data.py`:

```python
INDEX_NAME = "my-custom-index"  # Change this
```

### Change the Embedding Model

Edit `backend/pinecone/upload_data.py`:

```python
EMBEDDING_MODEL = "llama-text-embed-v2"  # Options: llama-text-embed-v2, multilingual-e5-large
```

### Adjust Search Behavior

Edit `backend/main.py` to change when products are searched:

```python
def should_search_products(self, query: str) -> bool:
    # Add or remove keywords
    search_keywords = [
        "find", "where", "locate",
        # Add your custom keywords
    ]
```

## 🚨 Troubleshooting

### "PINECONE_API_KEY not found"

**Solution**: Make sure your `.env` file has the API key:
```bash
PINECONE_API_KEY=your_actual_key_here
```

### "Index already exists"

**Solution**: The upload script will ask if you want to recreate it. Choose:
- `yes` to delete and recreate with fresh data
- `no` to use the existing index

### "Vector search not available"

**Solution**: Check the following:
1. Is `PINECONE_API_KEY` in your `.env` file?
2. Did you run `upload_data.py` successfully?
3. Are dependencies installed (`pip install -r requirements.txt`)?

### Search Returns No Results

**Solution**:
1. Make sure the index was uploaded successfully
2. Wait 10-15 seconds after upload for indexing to complete
3. Try a broader query

### Low Search Quality

**Solution**:
1. The system uses reranking by default for best results
2. Try using more descriptive queries
3. Use category filters for more specific searches

## 📊 Index Statistics

To check your index statistics:

```python
from pinecone.vector_search import VectorSearchEngine

engine = VectorSearchEngine()
stats = engine.get_index_stats()

print(f"Total Products: {stats['total_vectors']}")
print(f"Dimension: {stats['dimension']}")
```

## 🔐 Security Best Practices

1. ✅ Never commit `.env` file to version control
2. ✅ Keep API keys secret
3. ✅ Use environment variables for sensitive data
4. ✅ Add `.env` to your `.gitignore`

## 📚 Next Steps

1. **Customize the Agent Prompt**: Edit the prompt in `main.py` to change how the agent responds
2. **Add More Products**: Update `data/winmart_inventory.csv` and re-run the upload
3. **Test Different Queries**: Try various product searches to see how it performs
4. **Integrate with Frontend**: Connect your React frontend to the WebSocket

## 🆘 Need Help?

Check these resources:
- 📖 [Pinecone Documentation](https://docs.pinecone.io/)
- 📖 [Vector Search README](./pinecone/README.md)
- 🔧 [ElevenLabs Documentation](https://elevenlabs.io/docs)

## ✅ Success Checklist

- [ ] Pinecone API key added to `.env`
- [ ] Dependencies installed (`pip install -r requirements.txt`)
- [ ] Data uploaded successfully (`python pinecone/upload_data.py`)
- [ ] Vector search tests pass (`python pinecone/vector_search.py`)
- [ ] Health endpoint shows `vector_search_enabled: true`
- [ ] Search API endpoint returns results
- [ ] Agent responds to product queries via WebSocket

---

**Congratulations!** 🎉 Your StorePal application now has intelligent product search powered by Pinecone vector embeddings!

