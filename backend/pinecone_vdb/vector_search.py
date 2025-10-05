"""
Vector Search Module for WinMart Inventory
This module provides a class-based interface for searching products using Pinecone.
Supports semantic search, filtering, and reranking.
"""

import os
import sys
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from dotenv import load_dotenv
from pinecone import Pinecone

# Fix Windows console encoding for emojis
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except:
        pass

load_dotenv()


@dataclass
class SearchResult:
    """Data class to represent a search result."""
    product_id: int
    item_name: str
    category: str
    description: str
    aisle_location: str
    score: float
    chunk_text: str
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert search result to dictionary."""
        return {
            "product_id": self.product_id,
            "item_name": self.item_name,
            "category": self.category,
            "description": self.description,
            "aisle_location": self.aisle_location,
            "score": self.score,
            "chunk_text": self.chunk_text
        }
    
    def to_natural_language(self) -> str:
        """Convert search result to natural language response."""
        return (
            f"{self.item_name} is available in the {self.category} section, "
            f"located in aisle {self.aisle_location}. {self.description}"
        )


class VectorSearchEngine:
    """
    Vector Search Engine for WinMart inventory.
    Provides semantic search, filtering, and reranking capabilities.
    """
    
    def __init__(
        self,
        index_name: str = "winmart-inventory",
        namespace: str = "winmart-products",
        api_key: Optional[str] = None
    ):
        """
        Initialize the Vector Search Engine.
        
        Args:
            index_name: Name of the Pinecone index
            namespace: Namespace within the index
            api_key: Pinecone API key (defaults to env variable)
        """
        self.index_name = index_name
        self.namespace = namespace
        self.api_key = api_key or os.getenv("PINECONE_API_KEY")
        
        if not self.api_key:
            raise ValueError("PINECONE_API_KEY must be set in environment or passed as argument")
        
        # Initialize Pinecone client
        self.pc = Pinecone(api_key=self.api_key)
        
        # Get the index
        try:
            self.index = self.pc.Index(self.index_name)
            print(f"✅ VectorSearchEngine initialized with index '{self.index_name}'")
        except Exception as e:
            print(f"❌ Error initializing index: {e}")
            raise
    
    def _parse_hits(self, hits: List[Dict]) -> List[SearchResult]:
        """
        Parse Pinecone search hits into SearchResult objects.
        
        Args:
            hits: List of hit dictionaries from Pinecone
            
        Returns:
            List of SearchResult objects
        """
        results = []
        for i, hit in enumerate(hits):
            # Access hit as dict-like object (not calling .keys())
            fields = hit.get('fields', {}) if hasattr(hit, 'get') else hit.get('fields', {}) if isinstance(hit, dict) else {}
            
            # Handle both dict and object access
            if not fields and hasattr(hit, '__getitem__'):
                fields = hit['fields'] if 'fields' in hit else {}
            
            result = SearchResult(
                product_id=int(fields.get('product_id', 0)) if fields.get('product_id') else 0,
                item_name=fields.get('item_name', ''),
                category=fields.get('category', ''),
                description=fields.get('description', ''),
                aisle_location=fields.get('aisle_location', ''),
                score=hit.get('_score', 0.0) if hasattr(hit, 'get') else hit['_score'] if '_score' in hit else 0.0,
                chunk_text=fields.get('chunk_text', '')
            )
            results.append(result)
        return results
    
    def semantic_search(
        self,
        query: str,
        top_k: int = 5,
        min_score: Optional[float] = None
    ) -> List[SearchResult]:
        """
        Perform semantic search on the inventory.
        
        Args:
            query: Natural language query
            top_k: Number of results to return
            min_score: Minimum similarity score threshold
            
        Returns:
            List of SearchResult objects
        """
        try:
            # Perform search with integrated embedding
            response = self.index.search(
                namespace=self.namespace,
                query={
                    "top_k": top_k,
                    "inputs": {
                        'text': query
                    }
                }
            )
            
            # Parse results - handle SearchRecordsResponse object
            if isinstance(response, dict):
                hits = response.get('result', {}).get('hits', [])
            else:
                # Handle SearchRecordsResponse object
                hits = response['result']['hits'] if 'result' in response else []
            results = self._parse_hits(hits)
            
            # Filter by minimum score if specified
            if min_score is not None:
                results = [r for r in results if r.score >= min_score]
            
            return results
            
        except Exception as e:
            print(f"❌ Error during semantic search: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def search_with_filter(
        self,
        query: str,
        category: Optional[str] = None,
        aisle: Optional[str] = None,
        top_k: int = 5
    ) -> List[SearchResult]:
        """
        Perform semantic search with metadata filters.
        
        Args:
            query: Natural language query
            category: Filter by product category (e.g., "Produce", "Dairy")
            aisle: Filter by aisle location (e.g., "A1", "B2")
            top_k: Number of results to return
            
        Returns:
            List of SearchResult objects
        """
        try:
            # Build filter expression
            filter_expr = {}
            if category:
                filter_expr["category"] = {"$eq": category}
            if aisle:
                filter_expr["aisle_location"] = {"$eq": aisle}
            
            # Perform search with filter
            response = self.index.search(
                namespace=self.namespace,
                query={
                    "top_k": top_k,
                    "inputs": {
                        'text': query
                    },
                    "filter": filter_expr if filter_expr else None
                }
            )
            
            # Parse results
            hits = response.get('result', {}).get('hits', [])
            results = self._parse_hits(hits)
            
            return results
            
        except Exception as e:
            print(f"❌ Error during filtered search: {e}")
            return []
    
    def search_with_reranking(
        self,
        query: str,
        top_k: int = 20,
        top_n: int = 5,
        rerank_model: str = "bge-reranker-v2-m3"
    ) -> List[SearchResult]:
        """
        Perform semantic search with reranking for improved accuracy.
        
        Args:
            query: Natural language query
            top_k: Number of initial results to retrieve
            top_n: Number of results to return after reranking
            rerank_model: Reranking model to use
            
        Returns:
            List of SearchResult objects (reranked)
        """
        try:
            # Perform search with reranking
            response = self.index.search(
                namespace=self.namespace,
                query={
                    "top_k": top_k,
                    "inputs": {
                        'text': query
                    }
                },
                rerank={
                    "model": rerank_model,
                    "top_n": top_n,
                    "rank_fields": ["chunk_text"]
                }
            )
            
            # Parse results - handle SearchRecordsResponse object
            if isinstance(response, dict):
                hits = response.get('result', {}).get('hits', [])
            else:
                # Handle SearchRecordsResponse object
                hits = response['result']['hits'] if 'result' in response else []
            results = self._parse_hits(hits)
            
            return results
            
        except Exception as e:
            print(f"❌ Error during reranked search: {e}")
            import traceback
            traceback.print_exc()
            # Fallback to regular search
            return self.semantic_search(query, top_k=top_n)
    
    def search_by_category(
        self,
        category: str,
        query: Optional[str] = None,
        top_k: int = 10
    ) -> List[SearchResult]:
        """
        Search products within a specific category.
        
        Args:
            category: Product category (e.g., "Produce", "Dairy", "Meat")
            query: Optional query within the category
            top_k: Number of results to return
            
        Returns:
            List of SearchResult objects
        """
        if query:
            # Search with category filter
            return self.search_with_filter(query, category=category, top_k=top_k)
        else:
            # Just browse category
            search_query = f"Show me products in {category}"
            return self.search_with_filter(search_query, category=category, top_k=top_k)
    
    def search_by_aisle(
        self,
        aisle: str,
        query: Optional[str] = None,
        top_k: int = 10
    ) -> List[SearchResult]:
        """
        Search products within a specific aisle.
        
        Args:
            aisle: Aisle location (e.g., "A1", "B2")
            query: Optional query within the aisle
            top_k: Number of results to return
            
        Returns:
            List of SearchResult objects
        """
        if query:
            # Search with aisle filter
            return self.search_with_filter(query, aisle=aisle, top_k=top_k)
        else:
            # Just browse aisle
            search_query = f"What is in aisle {aisle}"
            return self.search_with_filter(search_query, aisle=aisle, top_k=top_k)
    
    def multi_query_search(
        self,
        queries: List[str],
        top_k_per_query: int = 3
    ) -> List[SearchResult]:
        """
        Perform multiple searches and combine results.
        Useful for complex queries that can be broken down.
        
        Args:
            queries: List of query strings
            top_k_per_query: Number of results per query
            
        Returns:
            Combined list of SearchResult objects (deduplicated)
        """
        all_results = []
        seen_ids = set()
        
        for query in queries:
            results = self.semantic_search(query, top_k=top_k_per_query)
            for result in results:
                if result.product_id not in seen_ids:
                    all_results.append(result)
                    seen_ids.add(result.product_id)
        
        # Sort by score
        all_results.sort(key=lambda x: x.score, reverse=True)
        
        return all_results
    
    def get_product_recommendations(
        self,
        product_name: str,
        top_k: int = 5
    ) -> List[SearchResult]:
        """
        Get product recommendations based on a product name.
        Finds similar products using semantic search.
        
        Args:
            product_name: Name of the product
            top_k: Number of recommendations
            
        Returns:
            List of SearchResult objects (similar products)
        """
        query = f"Products similar to {product_name}"
        return self.semantic_search(query, top_k=top_k + 1)[1:]  # Exclude the product itself
    
    def format_results_for_agent(
        self,
        results: List[SearchResult],
        include_all_info: bool = True
    ) -> str:
        """
        Format search results as a natural language response for the AI agent.
        
        Args:
            results: List of SearchResult objects
            include_all_info: Whether to include detailed information
            
        Returns:
            Formatted string response
        """
        if not results:
            return "I couldn't find any products matching your query. Could you rephrase your question?"
        
        if len(results) == 1:
            result = results[0]
            return (
                f"I found {result.item_name}! It's in the {result.category} section, "
                f"located in aisle {result.aisle_location}. {result.description}"
            )
        
        # Multiple results
        response = f"I found {len(results)} products that might help:\n\n"
        
        for i, result in enumerate(results, 1):
            if include_all_info:
                response += (
                    f"{i}. {result.item_name} - Aisle {result.aisle_location}\n"
                    f"   {result.description}\n\n"
                )
            else:
                response += f"{i}. {result.item_name} - Aisle {result.aisle_location}\n"
        
        return response.strip()
    
    def get_index_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the Pinecone index.
        
        Returns:
            Dictionary with index statistics
        """
        try:
            stats = self.index.describe_index_stats()
            return {
                "total_vectors": stats.get('total_vector_count', 0),
                "dimension": stats.get('dimension', 0),
                "metric": stats.get('metric', ''),
                "namespaces": stats.get('namespaces', {})
            }
        except Exception as e:
            print(f"❌ Error getting index stats: {e}")
            return {}


# Convenience functions for quick usage

def quick_search(query: str, top_k: int = 5) -> List[SearchResult]:
    """
    Quick search function for simple queries.
    
    Args:
        query: Natural language query
        top_k: Number of results
        
    Returns:
        List of SearchResult objects
    """
    engine = VectorSearchEngine()
    return engine.semantic_search(query, top_k=top_k)


def search_and_format(query: str, top_k: int = 5) -> str:
    """
    Search and return formatted response ready for the AI agent.
    
    Args:
        query: Natural language query
        top_k: Number of results
        
    Returns:
        Formatted string response
    """
    engine = VectorSearchEngine()
    results = engine.search_with_reranking(query, top_k=20, top_n=top_k)
    return engine.format_results_for_agent(results)


if __name__ == "__main__":
    # Test the vector search engine
    print("\n" + "="*70)
    print("  🧪 Testing Vector Search Engine")
    print("="*70 + "\n")
    
    try:
        # Initialize engine
        engine = VectorSearchEngine()
        
        # Test 1: Basic semantic search
        print("Test 1: Semantic Search")
        print("Query: 'Where can I find organic oranges?'\n")
        results = engine.semantic_search("Where can I find organic oranges?", top_k=3)
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.item_name} (Aisle {result.aisle_location}) - Score: {result.score:.4f}")
        
        # Test 2: Search with reranking
        print("\n" + "-"*70)
        print("\nTest 2: Search with Reranking")
        print("Query: 'I need ingredients for a salad'\n")
        results = engine.search_with_reranking("I need ingredients for a salad", top_k=20, top_n=5)
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.item_name} (Aisle {result.aisle_location}) - Score: {result.score:.4f}")
        
        # Test 3: Category search
        print("\n" + "-"*70)
        print("\nTest 3: Category Search")
        print("Category: 'Dairy', Query: 'cheese'\n")
        results = engine.search_by_category("Dairy", "cheese", top_k=5)
        for i, result in enumerate(results, 1):
            print(f"{i}. {result.item_name} (Aisle {result.aisle_location})")
        
        # Test 4: Formatted response for agent
        print("\n" + "-"*70)
        print("\nTest 4: Formatted Response for Agent")
        print("Query: 'Do you have fresh fruit?'\n")
        response = search_and_format("Do you have fresh fruit?", top_k=3)
        print(response)
        
        # Test 5: Index statistics
        print("\n" + "-"*70)
        print("\nTest 5: Index Statistics\n")
        stats = engine.get_index_stats()
        print(f"Total Vectors: {stats['total_vectors']}")
        print(f"Dimension: {stats['dimension']}")
        print(f"Metric: {stats['metric']}")
        
        print("\n" + "="*70)
        print("  ✅ All Tests Completed!")
        print("="*70 + "\n")
        
    except Exception as e:
        print(f"\n❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()

