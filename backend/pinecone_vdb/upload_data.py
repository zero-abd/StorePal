"""
Standalone script to upload WinMart inventory data to Pinecone.
This script creates a Pinecone index and uploads all product data with embeddings.
"""

import os
import sys
import time
import argparse
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone

# Fix Windows console encoding for emojis
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

# Configuration
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "winmart-inventory"
EMBEDDING_MODEL = "llama-text-embed-v2"
CLOUD = "aws"
REGION = "us-east-1"

# Path to CSV file
DATA_PATH = Path(__file__).parent.parent / "data" / "winmart_inventory.csv"


def validate_environment():
    """Validate that required environment variables are set."""
    if not PINECONE_API_KEY:
        print("\n❌ ERROR: PINECONE_API_KEY not found in environment variables!")
        print("Please add PINECONE_API_KEY to your .env file")
        sys.exit(1)
    
    if not DATA_PATH.exists():
        print(f"\n❌ ERROR: Data file not found at {DATA_PATH}")
        sys.exit(1)
    
    print("✅ Environment validation passed")


def load_inventory_data():
    """Load inventory data from CSV file."""
    print(f"\n📁 Loading inventory data from {DATA_PATH}")
    
    df = pd.read_csv(DATA_PATH)
    print(f"✅ Loaded {len(df)} products")
    print(f"   Columns: {', '.join(df.columns.tolist())}")
    
    return df


def prepare_records(df):
    """
    Prepare records for Pinecone upload.
    Each record contains: _id, chunk_text (for embedding), and metadata.
    """
    print("\n🔄 Preparing records for Pinecone...")
    
    records = []
    for _, row in df.iterrows():
        # Create a rich text description for embedding
        chunk_text = (
            f"{row['item_name']} in {row['category']}. "
            f"{row['description']} "
            f"Located in aisle {row['aisle_location']}."
        )
        
        record = {
            "_id": f"prod_{row['id']}",
            "chunk_text": chunk_text,
            "item_name": row['item_name'],
            "category": row['category'],
            "description": row['description'],
            "aisle_location": row['aisle_location'],
            "product_id": int(row['id'])
        }
        records.append(record)
    
    print(f"✅ Prepared {len(records)} records")
    return records


def create_or_get_index(pc, force_recreate=False, use_existing=True):
    """Create a new Pinecone index or get existing one."""
    print(f"\n🔍 Checking for index '{INDEX_NAME}'...")
    
    # Check if index exists
    if pc.has_index(INDEX_NAME):
        print(f"ℹ️  Index '{INDEX_NAME}' already exists")
        
        if force_recreate:
            print(f"🗑️  Deleting existing index '{INDEX_NAME}' (--force flag)...")
            pc.delete_index(INDEX_NAME)
            time.sleep(5)  # Wait for deletion to complete
        elif use_existing:
            print("✅ Using existing index")
            return pc.Index(INDEX_NAME)
        else:
            response = input("Do you want to delete and recreate it? (yes/no): ").strip().lower()
            if response == "yes":
                print(f"🗑️  Deleting existing index '{INDEX_NAME}'...")
                pc.delete_index(INDEX_NAME)
                time.sleep(5)  # Wait for deletion to complete
            else:
                print("✅ Using existing index")
                return pc.Index(INDEX_NAME)
    
    # Create new index with integrated embedding model
    print(f"🚀 Creating new index '{INDEX_NAME}' with integrated embedding model...")
    pc.create_index_for_model(
        name=INDEX_NAME,
        cloud=CLOUD,
        region=REGION,
        embed={
            "model": EMBEDDING_MODEL,
            "field_map": {"text": "chunk_text"}
        }
    )
    
    print(f"✅ Index '{INDEX_NAME}' created successfully")
    
    # Wait for index to be ready
    print("⏳ Waiting for index to be ready...")
    while not pc.describe_index(INDEX_NAME).status['ready']:
        time.sleep(1)
    
    print("✅ Index is ready")
    return pc.Index(INDEX_NAME)


def upload_records(index, records, namespace="winmart-products"):
    """Upload records to Pinecone index."""
    print(f"\n⬆️  Uploading {len(records)} records to namespace '{namespace}'...")
    
    # Upload in batches (Pinecone max batch size is 96 for upsert_records)
    batch_size = 96
    total_batches = (len(records) + batch_size - 1) // batch_size
    
    for i in range(0, len(records), batch_size):
        batch = records[i:i + batch_size]
        batch_num = i // batch_size + 1
        
        print(f"   📦 Uploading batch {batch_num}/{total_batches} ({len(batch)} records)...")
        index.upsert_records(namespace, batch)
    
    print(f"✅ All records uploaded successfully!")


def verify_upload(index, namespace="winmart-products", expected_count=None):
    """Verify that records were uploaded correctly."""
    print(f"\n🔍 Verifying upload...")
    
    # Wait for indexing to complete
    print("⏳ Waiting for indexing to complete (10 seconds)...")
    time.sleep(10)
    
    # Get index statistics
    stats = index.describe_index_stats()
    print(f"\n📊 Index Statistics:")
    print(f"   Total vectors: {stats['total_vector_count']}")
    print(f"   Dimension: {stats['dimension']}")
    print(f"   Metric: {stats['metric']}")
    
    if 'namespaces' in stats and namespace in stats['namespaces']:
        namespace_count = stats['namespaces'][namespace]['vector_count']
        print(f"   Vectors in '{namespace}': {namespace_count}")
        
        if expected_count and namespace_count == expected_count:
            print(f"✅ Upload verified! All {expected_count} records are in the index.")
        else:
            print(f"⚠️  Expected {expected_count} records but found {namespace_count}")
    else:
        print(f"⚠️  Namespace '{namespace}' not found in statistics")


def test_search(index, namespace="winmart-products"):
    """Test the search functionality with a sample query."""
    print(f"\n🧪 Testing search functionality...")
    
    test_query = "Where can I find organic oranges?"
    print(f"   Query: '{test_query}'")
    
    results = index.search(
        namespace=namespace,
        query={
            "top_k": 5,
            "inputs": {
                'text': test_query
            }
        }
    )
    
    print(f"\n📋 Top 5 results:")
    for i, hit in enumerate(results['result']['hits'], 1):
        print(f"\n   {i}. {hit['fields']['item_name']}")
        print(f"      Category: {hit['fields']['category']}")
        print(f"      Aisle: {hit['fields']['aisle_location']}")
        print(f"      Score: {hit['_score']:.4f}")
        print(f"      Description: {hit['fields']['description']}")


def main():
    """Main function to orchestrate the upload process."""
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Upload WinMart inventory to Pinecone')
    parser.add_argument('--force', action='store_true', 
                       help='Force recreation of index if it exists')
    args = parser.parse_args()
    
    print("\n" + "="*70)
    print("  🚀 WinMart Inventory Upload to Pinecone")
    print("="*70)
    
    # Step 1: Validate environment
    validate_environment()
    
    # Step 2: Load data
    df = load_inventory_data()
    
    # Step 3: Prepare records
    records = prepare_records(df)
    
    # Step 4: Initialize Pinecone
    print(f"\n🔌 Connecting to Pinecone...")
    pc = Pinecone(api_key=PINECONE_API_KEY)
    print("✅ Connected to Pinecone")
    
    # Step 5: Create or get index
    index = create_or_get_index(pc, force_recreate=args.force)
    
    # Step 6: Upload records
    upload_records(index, records)
    
    # Step 7: Verify upload
    verify_upload(index, expected_count=len(records))
    
    # Step 8: Test search
    test_search(index)
    
    print("\n" + "="*70)
    print("  ✅ Upload Complete!")
    print("="*70)
    print(f"\n  Index Name: {INDEX_NAME}")
    print(f"  Namespace: winmart-products")
    print(f"  Total Products: {len(records)}")
    print(f"  Embedding Model: {EMBEDDING_MODEL}")
    print("\n" + "="*70 + "\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Upload cancelled by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n\n❌ Error during upload: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

